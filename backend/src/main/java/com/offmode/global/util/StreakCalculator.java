package com.offmode.global.util;

import java.time.LocalDate;
import java.util.Set;

/**
 * 연속 달성 일수(스트릭) 계산기.
 *
 * <p>오늘 아직 인증하지 않았어도 어제까지 이어진 기록은 유지된다. 개인 통계(UserService)와 방 통계(RoomService)가 같은 규칙을 쓰도록 한 곳에 모았다.
 */
public final class StreakCalculator {

  private StreakCalculator() {}

  /**
   * 오늘 인증이 있으면 오늘부터, 없으면 어제부터 거꾸로 이어진 인증 일수를 센다.
   *
   * @param verifiedDates 인증 완료된 날짜 집합
   * @param today 기준 날짜
   */
  public static int compute(Set<LocalDate> verifiedDates, LocalDate today) {
    if (verifiedDates == null || verifiedDates.isEmpty()) return 0;

    LocalDate cursor = verifiedDates.contains(today) ? today : today.minusDays(1);
    int streak = 0;
    while (verifiedDates.contains(cursor)) {
      streak++;
      cursor = cursor.minusDays(1);
    }
    return streak;
  }
}
