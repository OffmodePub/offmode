package com.offmode.boundedcontext.feed.service;

import com.offmode.boundedcontext.badge.service.BadgeService;
import com.offmode.boundedcontext.feed.dto.response.FeedItemResponse;
import com.offmode.boundedcontext.feed.dto.response.FeedStatsResponse;
import com.offmode.boundedcontext.feed.dto.response.ReactionSummaryResponse;
import com.offmode.boundedcontext.feed.entity.Reaction;
import com.offmode.boundedcontext.feed.entity.Verification;
import com.offmode.boundedcontext.feed.entity.VerificationConfirm;
import com.offmode.boundedcontext.feed.repository.ReactionRepository;
import com.offmode.boundedcontext.feed.repository.VerificationConfirmRepository;
import com.offmode.boundedcontext.feed.repository.VerificationRepository;
import com.offmode.boundedcontext.mission.entity.UserMission;
import com.offmode.boundedcontext.mission.repository.UserMissionRepository;
import com.offmode.boundedcontext.mission.types.MissionStatus;
import com.offmode.boundedcontext.user.dto.response.UserStatsResponse;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.service.UserService;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.file.ImageUploadService;
import com.offmode.global.status.ErrorStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeedService {

  private final VerificationRepository verificationRepository;
  private final VerificationConfirmRepository confirmRepository;
  private final ReactionRepository reactionRepository;
  private final UserMissionRepository userMissionRepository;
  private final UserService userService;
  private final BadgeService badgeService;
  private final ImageUploadService imageUploadService;

  private static final int VERIFY_THRESHOLD = 1;

  @Transactional
  public Verification verify(Long userId, Long userMissionId, MultipartFile photo, String caption) {
    UserMission mission =
        userMissionRepository
            .findById(userMissionId)
            .orElseThrow(() -> new BusinessException(ErrorStatus.MISSION_NOT_FOUND));

    if (!mission.getUser().getId().equals(userId)) {
      throw new BusinessException(ErrorStatus.AUTH_ACCESS_DENIED);
    }

    if (verificationRepository.existsByUserMissionId(userMissionId)) {
      throw new BusinessException(ErrorStatus.VERIFICATION_ALREADY_SUBMITTED);
    }

    // 사진 저장 (R2 우선, 없으면 로컬)
    String photoUrl = null;
    if (photo != null && !photo.isEmpty()) {
      photoUrl = imageUploadService.uploadVerificationImage(photo);
    }

    // 인증 저장 (상태는 "pending" 유지 — 피어 인증 후 완료 처리)
    User user = userService.getById(userId);
    return verificationRepository.save(
        Verification.builder()
            .userMission(mission)
            .user(user)
            .photoUrl(photoUrl)
            .caption(caption)
            .build());
  }

  @Transactional
  public void confirm(Long userId, Long verificationId) {
    Verification v =
        verificationRepository
            .findById(verificationId)
            .orElseThrow(() -> new BusinessException(ErrorStatus.VERIFICATION_NOT_FOUND));

    // 본인 인증은 불가
    if (v.getUser().getId().equals(userId)) {
      throw new BusinessException(ErrorStatus.VERIFICATION_SELF_CONFIRM_NOT_ALLOWED);
    }

    // 이미 인증해줬는지 확인
    if (confirmRepository.existsByVerificationIdAndUserId(verificationId, userId)) {
      throw new BusinessException(ErrorStatus.VERIFICATION_ALREADY_CONFIRMED);
    }

    User confirmer = userService.getById(userId);
    confirmRepository.save(VerificationConfirm.builder().verification(v).user(confirmer).build());

    // 피어 인증 수가 threshold 이상이면 미션 완료 처리
    long count = confirmRepository.countByVerificationId(verificationId);
    if (count >= VERIFY_THRESHOLD) {
      UserMission mission = v.getUserMission();
      if (!MissionStatus.VERIFIED.equals(mission.getStatus())) {
        mission.setStatus(MissionStatus.VERIFIED);
        mission.setVerifiedAt(LocalDateTime.now());
        userMissionRepository.save(mission);

        // 레벨업 + 배지 체크 (미션 주인에게)
        Long ownerId = mission.getUser().getId();
        long verifiedCount =
            userMissionRepository.countByUserIdAndStatus(ownerId, MissionStatus.VERIFIED);
        userService.levelUp(ownerId, (int) verifiedCount);
        badgeService.checkAndAward(ownerId);
      }
    }
  }

  @Transactional
  public List<ReactionSummaryResponse> react(Long userId, Long verificationId, String emoji) {
    Verification v =
        verificationRepository
            .findById(verificationId)
            .orElseThrow(() -> new BusinessException(ErrorStatus.VERIFICATION_NOT_FOUND));

    List<Reaction> userReactions =
        reactionRepository.findByVerificationIdAndUserId(verificationId, userId);
    Reaction existing =
        userReactions.stream()
            .filter(reaction -> reaction.getEmoji().equals(emoji))
            .findFirst()
            .orElse(null);

    if (existing != null) {
      reactionRepository.delete(existing);
    } else {
      User user = userService.getById(userId);
      reactionRepository.save(Reaction.builder().verification(v).user(user).emoji(emoji).build());
    }

    return toReactionSummaries(reactionRepository.findByVerificationId(verificationId), userId);
  }

  @Transactional(readOnly = true)
  public List<FeedItemResponse> getFeed(Long userId, int page, int size) {
    // 오늘 내 미션 텍스트 조회 — 없으면 빈 피드 반환
    LocalDateTime todayStart = LocalDate.now().atStartOfDay();
    LocalDateTime todayEnd = LocalDate.now().plusDays(1).atStartOfDay();
    UserMission todayMission =
        userMissionRepository
            .findFirstByUserIdAndAssignedAtBetweenOrderByAssignedAtDesc(
                userId, todayStart, todayEnd)
            .orElse(null);
    log.info(
        "[GET-FEED] userId={} 오늘 미션={}",
        userId,
        todayMission == null
            ? "없음"
            : todayMission.getMissionText() + " (id=" + todayMission.getId() + ")");
    if (todayMission == null) return List.of();

    String missionText = todayMission.getMissionText();
    List<FeedItemResponse> items =
        verificationRepository.findFeedItems(PageRequest.of(page, size), userId, missionText);
    log.info("[GET-FEED] 필터 missionText='{}' → 조회된 피드 {}건", missionText, items.size());
    if (items.isEmpty()) return items;

    // DB collation에 따른 이모지 GROUP BY 병합을 피하기 위해 애플리케이션에서 정확히 집계한다.
    List<Long> ids = items.stream().map(FeedItemResponse::getId).toList();
    Map<Long, List<ReactionSummaryResponse>> reactionMap =
        toReactionSummaryMap(reactionRepository.findByVerificationIdIn(ids), userId);

    items.forEach(
        item -> item.setReactions(reactionMap.getOrDefault(item.getId(), java.util.List.of())));
    return items;
  }

  private Map<Long, List<ReactionSummaryResponse>> toReactionSummaryMap(
      List<Reaction> reactions, Long userId) {
    Map<Long, Map<String, ReactionAggregate>> grouped = new HashMap<>();
    for (Reaction reaction : reactions) {
      Long verificationId = reaction.getVerification().getId();
      grouped
          .computeIfAbsent(verificationId, key -> new LinkedHashMap<>())
          .computeIfAbsent(reaction.getEmoji(), key -> new ReactionAggregate())
          .add(reaction, userId);
    }

    Map<Long, List<ReactionSummaryResponse>> result = new HashMap<>();
    grouped.forEach(
        (verificationId, emojiMap) ->
            result.put(
                verificationId,
                emojiMap.entrySet().stream()
                    .map(
                        entry ->
                            new ReactionSummaryResponse(
                                entry.getKey(),
                                entry.getValue().count(),
                                entry.getValue().myReact()))
                    .sorted(
                        Comparator.comparingLong(ReactionSummaryResponse::count)
                            .reversed()
                            .thenComparing(ReactionSummaryResponse::emoji))
                    .toList()));
    return result;
  }

  private List<ReactionSummaryResponse> toReactionSummaries(List<Reaction> reactions, Long userId) {
    Map<Long, List<ReactionSummaryResponse>> reactionMap = toReactionSummaryMap(reactions, userId);
    if (reactions.isEmpty()) return List.of();
    Long verificationId = reactions.getFirst().getVerification().getId();
    return reactionMap.getOrDefault(verificationId, List.of());
  }

  private static class ReactionAggregate {
    private long count;
    private boolean myReact;

    void add(Reaction reaction, Long viewerId) {
      count++;
      if (reaction.getUser().getId().equals(viewerId)) {
        myReact = true;
      }
    }

    long count() {
      return count;
    }

    boolean myReact() {
      return myReact;
    }
  }

  public FeedStatsResponse getStats(Long userId) {
    // 오늘 자정부터 현재까지 미션을 수락한 유저 수
    LocalDateTime todayStart = LocalDateTime.now().toLocalDate().atStartOfDay();
    long activeToday = userMissionRepository.countDistinctUsersSince(todayStart);

    // 전체 인증 완료율
    long total = userMissionRepository.count();
    long verified = userMissionRepository.countByStatus(MissionStatus.VERIFIED);
    int verificationRate = total == 0 ? 0 : (int) (verified * 100 / total);

    // 현재 유저 연속 달성 일수 (UserService의 getStats 재활용)
    UserStatsResponse userStats = userService.getStats(userId);
    int streakDays = userStats.getStreak();

    return new FeedStatsResponse(activeToday, verificationRate, streakDays);
  }
}
