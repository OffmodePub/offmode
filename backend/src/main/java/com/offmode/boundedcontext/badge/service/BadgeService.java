package com.offmode.boundedcontext.badge.service;

import com.offmode.boundedcontext.badge.dto.response.BadgeResponse;
import com.offmode.boundedcontext.badge.entity.UserBadge;
import com.offmode.boundedcontext.badge.repository.UserBadgeRepository;
import com.offmode.boundedcontext.badge.types.BadgeDefinition;
import com.offmode.boundedcontext.mission.repository.UserMissionRepository;
import com.offmode.boundedcontext.mission.types.MissionCategory;
import com.offmode.boundedcontext.mission.types.MissionStatus;
import com.offmode.boundedcontext.room.repository.RoomProofRepository;
import com.offmode.boundedcontext.room.repository.RoomReactionRepository;
import com.offmode.boundedcontext.room.types.ProofStatus;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BadgeService {

  private final UserBadgeRepository userBadgeRepository;
  private final UserMissionRepository userMissionRepository;
  private final UserRepository userRepository;
  private final RoomProofRepository roomProofRepository;
  private final RoomReactionRepository roomReactionRepository;

  /** 모든 배지 정의 + 획득 여부 반환 */
  public List<BadgeResponse> getUserBadges(Long userId) {
    Map<String, UserBadge> earned =
        userBadgeRepository.findByUserId(userId).stream()
            .collect(Collectors.toMap(UserBadge::getBadgeKey, ub -> ub));

    return Arrays.stream(BadgeDefinition.values())
        .map(def -> new BadgeResponse(def, earned.get(def.getKey())))
        .toList();
  }

  /** 미션 완료/인증 후 호출 — 새로 획득된 배지 목록 반환 */
  @Transactional
  public List<BadgeDefinition> checkAndAward(Long userId) {
    Set<String> alreadyEarned = userBadgeRepository.findEarnedKeys(userId);
    List<BadgeDefinition> newlyEarned = new ArrayList<>();

    for (BadgeDefinition def : BadgeDefinition.values()) {
      if (alreadyEarned.contains(def.getKey())) continue;
      if (qualifies(userId, def)) {
        award(userId, def);
        newlyEarned.add(def);
      }
    }
    return newlyEarned;
  }

  // ── 조건 판별 ─────────────────────────────────────────────

  private boolean qualifies(Long userId, BadgeDefinition def) {
    return switch (def) {
        // 기본 성취
      case EXPLORER_LV01 -> verifiedCount(userId) >= 1;
      case COLLECTOR_LV02 -> verifiedCount(userId) >= 10;
      case REAL_WORLD_RULER -> verifiedCount(userId) >= 100;

        // 유형별
      case WALKER -> verifiedByCategory(userId, MissionCategory.ENERGY) >= 10;
      case BEAUTY_CURATOR -> verifiedByCategory(userId, MissionCategory.INTELLECT) >= 10;
      case LOCAL_HIPSTER -> verifiedByCategory(userId, MissionCategory.VITALITY) >= 10;

        // 시간대
      case DAWN_MASTER -> verifiedByHour(userId, 0, 6) >= 5;
      case AFTERNOON_FREE -> verifiedByHour(userId, 12, 18) >= 5;
      case EVENING_WARDEN -> verifiedByHour(userId, 18, 22) >= 5;

        // 소셜 (셀프 리액션은 양쪽 모두 집계에서 제외)
      case EMOJI_ARTIST -> roomReactionRepository.countGivenToOthers(userId) >= 50;
      case REACTION_MASTER -> roomReactionRepository.countReceivedFromOthers(userId) >= 100;

        // 유니크
      case OFFMODE_ENTRY -> userMissionRepository.existsByUserId(userId);
      case SKY_COLLECTOR ->
          userMissionRepository.countByStatusAndTextKeyword(userId, MissionStatus.VERIFIED, "하늘")
                  + roomProofRepository.countByUserIdAndStatusAndRoomMissionTitleContaining(
                      userId, ProofStatus.VERIFIED, "하늘")
              >= 10;
      case SPEEDRUNNER -> maxConsecutiveDays(userId) >= 7;
    };
  }

  // ── 공통 쿼리 헬퍼 ───────────────────────────────────────

  private long verifiedCount(Long userId) {
    return userMissionRepository.countByUserIdAndStatus(userId, MissionStatus.VERIFIED)
        + roomProofRepository.countByUserIdAndStatus(userId, ProofStatus.VERIFIED);
  }

  private long verifiedByCategory(Long userId, MissionCategory category) {
    return userMissionRepository.countByUserIdAndStatusAndMissionCategory(
            userId, MissionStatus.VERIFIED, category)
        + roomProofRepository.countByUserIdAndStatusAndRoomMissionCategory(
            userId, ProofStatus.VERIFIED, category);
  }

  private long verifiedByHour(Long userId, int fromHour, int toHour) {
    long legacy =
        userMissionRepository.countByStatusAndHourRange(
            userId, MissionStatus.VERIFIED, fromHour, toHour);
    long room =
        roomProofRepository.findCreatedAtByUserIdAndStatus(userId, ProofStatus.VERIFIED).stream()
            .filter(java.util.Objects::nonNull)
            .map(LocalDateTime::getHour)
            .filter(hour -> hour >= fromHour && hour < toHour)
            .count();
    return legacy + room;
  }

  /** 최대 연속 미션 달성 일수 계산 — 개인 미션 인증 날짜 + 방 인증 날짜를 합산 */
  private int maxConsecutiveDays(Long userId) {
    Set<LocalDate> verifiedDates =
        userMissionRepository.findVerifiedDateTimes(userId, MissionStatus.VERIFIED).stream()
            .map(LocalDateTime::toLocalDate)
            .collect(Collectors.toCollection(HashSet::new));
    verifiedDates.addAll(roomProofRepository.findVerifiedDatesByUser(userId, ProofStatus.VERIFIED));

    List<LocalDate> dates = verifiedDates.stream().sorted().toList();

    if (dates.isEmpty()) return 0;

    int maxStreak = 1, cur = 1;
    for (int i = 1; i < dates.size(); i++) {
      if (dates.get(i).minusDays(1).equals(dates.get(i - 1))) {
        cur++;
        maxStreak = Math.max(maxStreak, cur);
      } else {
        cur = 1;
      }
    }
    return maxStreak;
  }

  // ── 배지 수여 ─────────────────────────────────────────────

  private void award(Long userId, BadgeDefinition def) {
    User user = userRepository.getReferenceById(userId);
    userBadgeRepository.save(UserBadge.builder().user(user).badgeKey(def.getKey()).build());
  }
}
