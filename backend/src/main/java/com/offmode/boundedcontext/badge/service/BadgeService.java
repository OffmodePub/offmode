package com.offmode.boundedcontext.badge.service;

import com.offmode.boundedcontext.badge.dto.response.BadgeDto;
import com.offmode.boundedcontext.badge.entity.UserBadge;
import com.offmode.boundedcontext.badge.repository.UserBadgeRepository;
import com.offmode.boundedcontext.badge.types.BadgeDefinition;
import com.offmode.boundedcontext.mission.repository.UserMissionRepository;
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

  /** 모든 배지 정의 + 획득 여부 반환 */
  public List<BadgeDto> getUserBadges(Long userId) {
    Map<String, UserBadge> earned =
        userBadgeRepository.findByUserId(userId).stream()
            .collect(Collectors.toMap(UserBadge::getBadgeKey, ub -> ub));

    return Arrays.stream(BadgeDefinition.values())
        .map(def -> new BadgeDto(def, earned.get(def.getKey())))
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
      case WALKER -> verifiedByCategory(userId, "Energy") >= 10;
      case BEAUTY_CURATOR -> verifiedByCategory(userId, "Intellect") >= 10;
      case LOCAL_HIPSTER -> verifiedByCategory(userId, "Vitality") >= 10;

        // 시간대
      case DAWN_MASTER -> verifiedByHour(userId, 0, 6) >= 5;
      case AFTERNOON_FREE -> verifiedByHour(userId, 12, 18) >= 5;
      case EVENING_WARDEN -> verifiedByHour(userId, 18, 22) >= 5;

        // 소셜 (리액션 시스템 미구현 → 항상 false)
      case EMOJI_ARTIST, REACTION_MASTER -> false;

        // 유니크
      case OFFMODE_ENTRY -> userMissionRepository.existsByUserId(userId);
      case SKY_COLLECTOR -> userMissionRepository.countVerifiedByTextKeyword(userId, "하늘") >= 10;
      case SPEEDRUNNER -> maxConsecutiveDays(userId) >= 7;
    };
  }

  // ── 공통 쿼리 헬퍼 ───────────────────────────────────────

  private long verifiedCount(Long userId) {
    return userMissionRepository.countByUserIdAndStatus(userId, "verified");
  }

  private long verifiedByCategory(Long userId, String category) {
    return userMissionRepository.countByUserIdAndStatusAndMissionCategory(
        userId, "verified", category);
  }

  private long verifiedByHour(Long userId, int fromHour, int toHour) {
    return userMissionRepository.countVerifiedByHourRange(userId, fromHour, toHour);
  }

  /** 최대 연속 미션 달성 일수 계산 */
  private int maxConsecutiveDays(Long userId) {
    List<LocalDate> dates =
        userMissionRepository.findVerifiedDateTimes(userId).stream()
            .map(LocalDateTime::toLocalDate)
            .distinct()
            .sorted()
            .toList();

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
