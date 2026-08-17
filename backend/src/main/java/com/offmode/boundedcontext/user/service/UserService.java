package com.offmode.boundedcontext.user.service;

import com.offmode.boundedcontext.badge.repository.UserBadgeRepository;
import com.offmode.boundedcontext.feed.repository.ReactionRepository;
import com.offmode.boundedcontext.feed.repository.VerificationConfirmRepository;
import com.offmode.boundedcontext.feed.repository.VerificationRepository;
import com.offmode.boundedcontext.mission.repository.UserMissionRepository;
import com.offmode.boundedcontext.mission.types.MissionCategory;
import com.offmode.boundedcontext.mission.types.MissionStatus;
import com.offmode.boundedcontext.part.repository.UserPartRepository;
import com.offmode.boundedcontext.room.entity.RoomMember;
import com.offmode.boundedcontext.room.repository.RoomMemberRepository;
import com.offmode.boundedcontext.room.repository.RoomNudgeRepository;
import com.offmode.boundedcontext.room.repository.RoomProofConfirmRepository;
import com.offmode.boundedcontext.room.repository.RoomProofReportRepository;
import com.offmode.boundedcontext.room.repository.RoomProofRepository;
import com.offmode.boundedcontext.room.repository.RoomReactionRepository;
import com.offmode.boundedcontext.room.types.ProofStatus;
import com.offmode.boundedcontext.room.types.RoomRole;
import com.offmode.boundedcontext.user.dto.response.UserStatsResponse;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.repository.UserBlockRepository;
import com.offmode.boundedcontext.user.repository.UserRepository;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.status.ErrorStatus;
import com.offmode.global.util.StreakCalculator;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

  private final UserRepository userRepository;
  private final UserMissionRepository userMissionRepository;
  private final VerificationConfirmRepository verificationConfirmRepository;
  private final ReactionRepository reactionRepository;
  private final VerificationRepository verificationRepository;
  private final UserBadgeRepository userBadgeRepository;
  private final UserPartRepository userPartRepository;
  private final RoomProofRepository roomProofRepository;
  private final RoomReactionRepository roomReactionRepository;
  private final RoomProofConfirmRepository roomProofConfirmRepository;
  private final RoomProofReportRepository roomProofReportRepository;
  private final RoomNudgeRepository roomNudgeRepository;
  private final RoomMemberRepository roomMemberRepository;
  private final UserBlockRepository userBlockRepository;

  public User getById(Long id) {
    return userRepository
        .findById(id)
        .orElseThrow(() -> new BusinessException(ErrorStatus.USER_NOT_FOUND));
  }

  @Transactional
  public User updateProfile(
      Long userId,
      String name,
      String avatar,
      Integer missionHour,
      Integer missionMinute,
      Boolean autoRoulette) {
    User user = getById(userId);
    if (name != null && !name.isBlank()) user.setName(name);
    if (avatar != null && !avatar.isBlank()) user.setAvatar(avatar);
    if (missionHour != null) user.setMissionHour(missionHour);
    if (missionMinute != null) user.setMissionMinute(missionMinute);
    if (autoRoulette != null) user.setAutoRoulette(autoRoulette);
    return userRepository.save(user);
  }

  /** Expo 푸시 토큰을 등록/해제한다. 같은 토큰이 다른 계정에 남아 있으면(기기 공유·재로그인) 먼저 떼어내 한 기기가 한 계정에만 매핑되게 한다. */
  @Transactional
  public void updatePushToken(Long userId, String token) {
    User user = getById(userId);
    String normalized = (token == null || token.isBlank()) ? null : token.trim();

    if (normalized != null) {
      userRepository.clearPushTokenForOtherUsers(normalized, userId);
    }
    user.setExpoPushToken(normalized);
    userRepository.save(user);
  }

  @Transactional
  public void levelUp(Long userId, int verifiedCount) {
    User user = getById(userId);
    int newLevel = verifiedCount / 10 + 1;
    if (newLevel > user.getLevel()) {
      user.setLevel(newLevel);
      userRepository.save(user);
    }
  }

  // 인증(개인 미션 또는 방 인증)이 VERIFIED 로 확정될 때 호출 — 합산 누적 인증 수로 레벨업 반영
  @Transactional
  public void applyVerifiedProgress(Long userId) {
    levelUp(userId, (int) totalVerifiedCount(userId));
  }

  // 합산 누적 VERIFIED 인증 수 (개인 미션 + 방 인증) — getStats·applyVerifiedProgress 공유
  private long totalVerifiedCount(Long userId) {
    return userMissionRepository.countByUserIdAndStatus(userId, MissionStatus.VERIFIED)
        + roomProofRepository.countByUserIdAndStatus(userId, ProofStatus.VERIFIED);
  }

  public UserStatsResponse getStats(Long userId) {
    // 누적 통계는 레거시 개인 미션(UserMission)과 Rooms v2 방 인증(RoomProof)을 합산한다.
    // (현재 실제 인증은 방 인증으로만 저장되므로 RoomProof 미합산 시 누적이 오르지 않음)
    long totalMissions =
        userMissionRepository.countByUserId(userId) + roomProofRepository.countByUserId(userId);
    long totalVerified = totalVerifiedCount(userId);

    // 카테고리 통계도 개인 미션 + 방 인증(해당 category)을 합산한다.
    long energy =
        userMissionRepository.countByUserIdAndStatusAndMissionCategory(
                userId, MissionStatus.VERIFIED, MissionCategory.ENERGY)
            + roomProofRepository.countByUserIdAndStatusAndRoomMissionCategory(
                userId, ProofStatus.VERIFIED, MissionCategory.ENERGY);
    long intellect =
        userMissionRepository.countByUserIdAndStatusAndMissionCategory(
                userId, MissionStatus.VERIFIED, MissionCategory.INTELLECT)
            + roomProofRepository.countByUserIdAndStatusAndRoomMissionCategory(
                userId, ProofStatus.VERIFIED, MissionCategory.INTELLECT);
    long vitality =
        userMissionRepository.countByUserIdAndStatusAndMissionCategory(
                userId, MissionStatus.VERIFIED, MissionCategory.VITALITY)
            + roomProofRepository.countByUserIdAndStatusAndRoomMissionCategory(
                userId, ProofStatus.VERIFIED, MissionCategory.VITALITY);

    // 연속 달성 일수: 개인 미션 인증 날짜 + 방 인증 날짜를 합쳐서 계산
    Set<LocalDate> verifiedDates =
        userMissionRepository.findVerifiedDateTimes(userId, MissionStatus.VERIFIED).stream()
            .map(LocalDateTime::toLocalDate)
            .collect(Collectors.toCollection(HashSet::new));
    verifiedDates.addAll(roomProofRepository.findVerifiedDatesByUser(userId, ProofStatus.VERIFIED));
    int streak = StreakCalculator.compute(verifiedDates, LocalDate.now());

    return new UserStatsResponse(
        totalMissions,
        totalVerified,
        streak,
        fill(energy),
        level(energy),
        fill(intellect),
        level(intellect),
        fill(vitality),
        level(vitality));
  }

  @Transactional
  public void deleteAccount(Long userId) {
    // FK 순서대로 삭제
    verificationConfirmRepository.deleteByUserId(userId); // 내가 남긴 confirm
    verificationConfirmRepository.deleteByVerificationOwnerUserId(userId); // 내 인증에 달린 confirm
    reactionRepository.deleteByUserId(userId); // 내가 남긴 reaction
    reactionRepository.deleteByVerificationOwnerUserId(userId); // 내 인증에 달린 reaction
    verificationRepository.deleteByUserId(userId); // 내 인증
    userBadgeRepository.deleteByUserId(userId); // 내 배지
    userPartRepository.deleteByUserId(userId); // 내 파츠
    userMissionRepository.deleteByUserId(userId); // 내 미션
    userBlockRepository.deleteAllByUser(userId); // 내가 차단했거나 나를 차단한 행

    // 방(room) 도메인 정리 — 모든 방 자식 테이블은 users FK 가 있고 ON DELETE CASCADE 가 없다.
    // rooms/room_missions 는 users FK 가 없어 삭제할 필요가 없다.
    // owner 로 있던 방은 RoomService.leave 와 동일 정책으로 가장 먼저 들어온 남은 멤버에게 위임한다
    // (GROUP 방의 다른 멤버 데이터 보존). 남은 멤버가 없으면 빈 방으로 남는다(leave 와 동일).
    delegateRoomOwnership(userId);

    // FK 안전 순서: 인증에 달린 자식(리액션/컨펌/신고) → 콕찌르기 → 인증 → 멤버십
    roomReactionRepository.deleteByUserId(userId); // 내가 남긴 방 리액션
    roomReactionRepository.deleteByProofOwnerUserId(userId); // 내 방 인증에 달린 리액션
    roomProofConfirmRepository.deleteByUserId(userId); // 내가 남긴 방 confirm
    roomProofConfirmRepository.deleteByProofOwnerUserId(userId); // 내 방 인증에 달린 confirm
    roomProofReportRepository.deleteByReporterId(userId); // 내가 신고한 행
    roomProofReportRepository.deleteByProofOwnerUserId(userId); // 내 방 인증에 달린 신고
    roomNudgeRepository.deleteAllByUser(userId); // 내가 보냈거나 받은 콕찌르기
    roomProofRepository.deleteByUserId(userId); // 내 방 인증
    roomMemberRepository.deleteByUserId(userId); // 내 방 멤버십

    userRepository.deleteById(userId);
  }

  // 탈퇴 유저가 OWNER 인 방을 가장 먼저 들어온 남은 멤버에게 위임한다 (RoomService.leave 와 동일 정책).
  private void delegateRoomOwnership(Long userId) {
    for (RoomMember membership : roomMemberRepository.findWithRoomByUserId(userId)) {
      if (membership.getRole() != RoomRole.OWNER) continue;
      roomMemberRepository.findByRoomIdOrderByJoinedAtAsc(membership.getRoom().getId()).stream()
          .filter(next -> !next.getUser().getId().equals(userId))
          .findFirst()
          .ifPresent(
              next -> {
                next.setRole(RoomRole.OWNER);
                roomMemberRepository.save(next);
              });
    }
  }

  // 카테고리별 레벨당 10개 미션, fill은 현재 레벨 내 진행도
  private static int fill(long count) {
    return (int) ((count % 10) * 10);
  }

  private static int level(long count) {
    return (int) (count / 10) + 1;
  }
}
