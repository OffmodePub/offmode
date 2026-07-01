package com.offmode.boundedcontext.user.service;

import com.offmode.boundedcontext.badge.repository.UserBadgeRepository;
import com.offmode.boundedcontext.feed.repository.ReactionRepository;
import com.offmode.boundedcontext.feed.repository.VerificationConfirmRepository;
import com.offmode.boundedcontext.feed.repository.VerificationRepository;
import com.offmode.boundedcontext.mission.repository.UserMissionRepository;
import com.offmode.boundedcontext.mission.types.MissionCategory;
import com.offmode.boundedcontext.mission.types.MissionStatus;
import com.offmode.boundedcontext.part.repository.UserPartRepository;
import com.offmode.boundedcontext.room.repository.RoomProofRepository;
import com.offmode.boundedcontext.room.types.ProofStatus;
import com.offmode.boundedcontext.user.dto.response.UserStatsResponse;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.repository.UserRepository;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.status.ErrorStatus;
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

  @Transactional
  public void levelUp(Long userId, int verifiedCount) {
    User user = getById(userId);
    int newLevel = verifiedCount / 10 + 1;
    if (newLevel > user.getLevel()) {
      user.setLevel(newLevel);
      userRepository.save(user);
    }
  }

  public UserStatsResponse getStats(Long userId) {
    // 누적 통계는 레거시 개인 미션(UserMission)과 Rooms v2 방 인증(RoomProof)을 합산한다.
    // (현재 실제 인증은 방 인증으로만 저장되므로 RoomProof 미합산 시 누적이 오르지 않음)
    long totalMissions =
        userMissionRepository.findByUserIdOrderByAssignedAtDesc(userId).size()
            + roomProofRepository.countByUserId(userId);
    long totalVerified =
        userMissionRepository.countByUserIdAndStatus(userId, MissionStatus.VERIFIED)
            + roomProofRepository.countByUserIdAndStatus(userId, ProofStatus.VERIFIED);

    long energy =
        userMissionRepository.countByUserIdAndStatusAndMissionCategory(
            userId, MissionStatus.VERIFIED, MissionCategory.ENERGY);
    long intellect =
        userMissionRepository.countByUserIdAndStatusAndMissionCategory(
            userId, MissionStatus.VERIFIED, MissionCategory.INTELLECT);
    long vitality =
        userMissionRepository.countByUserIdAndStatusAndMissionCategory(
            userId, MissionStatus.VERIFIED, MissionCategory.VITALITY);

    // 연속 달성 일수: 개인 미션 인증 날짜 + 방 인증 날짜를 합쳐서 계산
    Set<LocalDate> verifiedDates =
        userMissionRepository.findVerifiedDateTimes(userId, MissionStatus.VERIFIED).stream()
            .map(LocalDateTime::toLocalDate)
            .collect(Collectors.toCollection(HashSet::new));
    verifiedDates.addAll(roomProofRepository.findVerifiedDatesByUser(userId, ProofStatus.VERIFIED));
    int streak = calcStreak(verifiedDates);

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

  // 연속 달성 일수 계산 (오늘부터 역순으로 확인)
  private int calcStreak(Set<LocalDate> dates) {
    if (dates.isEmpty()) return 0;

    LocalDate check = LocalDate.now();
    int streak = 0;
    while (dates.contains(check)) {
      streak++;
      check = check.minusDays(1);
    }
    return streak;
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
    userRepository.deleteById(userId);
  }

  // 카테고리별 레벨당 10개 미션, fill은 현재 레벨 내 진행도
  private static int fill(long count) {
    return (int) ((count % 10) * 10);
  }

  private static int level(long count) {
    return (int) (count / 10) + 1;
  }
}
