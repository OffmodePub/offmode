package com.offmode.global.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.Set;
import org.junit.jupiter.api.Test;

class StreakCalculatorTest {

  private static final LocalDate TODAY = LocalDate.of(2026, 8, 17);

  @Test
  void 인증기록이_없으면_0이다() {
    assertThat(StreakCalculator.compute(Set.of(), TODAY)).isZero();
  }

  @Test
  void 오늘_인증했으면_오늘부터_센다() {
    Set<LocalDate> dates = Set.of(TODAY, TODAY.minusDays(1), TODAY.minusDays(2));

    assertThat(StreakCalculator.compute(dates, TODAY)).isEqualTo(3);
  }

  @Test
  void 오늘_미인증이면_어제부터_센다() {
    Set<LocalDate> dates = Set.of(TODAY.minusDays(1), TODAY.minusDays(2), TODAY.minusDays(3));

    assertThat(StreakCalculator.compute(dates, TODAY)).isEqualTo(3);
  }

  @Test
  void 오늘도_어제도_없으면_0이다() {
    Set<LocalDate> dates = Set.of(TODAY.minusDays(2), TODAY.minusDays(3));

    assertThat(StreakCalculator.compute(dates, TODAY)).isZero();
  }

  @Test
  void 중간에_끊기면_이어진_구간까지만_센다() {
    Set<LocalDate> dates = Set.of(TODAY, TODAY.minusDays(1), TODAY.minusDays(3));

    assertThat(StreakCalculator.compute(dates, TODAY)).isEqualTo(2);
  }
}
