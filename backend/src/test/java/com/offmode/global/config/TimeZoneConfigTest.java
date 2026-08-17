package com.offmode.global.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.TimeZone;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class TimeZoneConfigTest {

  private static final ZoneId KST = ZoneId.of("Asia/Seoul");

  private TimeZone originalTimeZone;

  @BeforeEach
  void rememberOriginalTimeZone() {
    originalTimeZone = TimeZone.getDefault();
  }

  @AfterEach
  void restoreOriginalTimeZone() {
    TimeZone.setDefault(originalTimeZone);
  }

  @Test
  void appliesKstEvenWhenJvmDefaultsToUtc() {
    // 운영 컨테이너(alpine)의 기본 상태를 재현한다
    TimeZone.setDefault(TimeZone.getTimeZone("UTC"));

    new TimeZoneConfig().applyServiceTimeZone();

    assertThat(TimeZone.getDefault().toZoneId()).isEqualTo(KST);
  }

  @Test
  void makesNowFollowKoreanCalendarDate() {
    TimeZone.setDefault(TimeZone.getTimeZone("UTC"));

    new TimeZoneConfig().applyServiceTimeZone();

    // 한국시간 00:00~09:00 구간에서 UTC 는 아직 '어제'다. 고정 후에는 두 값이 항상 같아야 한다.
    assertThat(LocalDate.now()).isEqualTo(LocalDate.now(KST));
    assertThat(TimeZone.getDefault().getRawOffset())
        .isEqualTo((int) Duration.ofHours(9).toMillis());
  }

  @Test
  void exposesServiceZoneAsKst() {
    assertThat(TimeZoneConfig.SERVICE_ZONE).isEqualTo(KST);
  }
}
