package com.offmode.global.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.TimeZone;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * 스프링 컨텍스트가 실제로 기동될 때 기본 타임존이 KST 로 고정되는지 확인한다.
 *
 * <p>로컬(KST)에서는 자명하게 통과하지만, JVM 기본값이 UTC 인 CI·운영 컨테이너에서 회귀를 잡아내는 것이 이 테스트의 목적이다.
 */
@ActiveProfiles("dev")
@SpringBootTest
@TestPropertySource(
    properties = {
      "spring.datasource.url=jdbc:h2:mem:timezone-config-test;MODE=MySQL;DB_CLOSE_DELAY=-1",
      "spring.jpa.hibernate.ddl-auto=validate",
      "spring.flyway.locations=classpath:db/migration/h2",
      "spring.sql.init.mode=never"
    })
class TimeZoneConfigIntegrationTest {

  private static final ZoneId KST = ZoneId.of("Asia/Seoul");

  @Test
  void springContextFixesDefaultTimeZoneToKst() {
    assertThat(TimeZone.getDefault().toZoneId()).isEqualTo(KST);
    // 도메인 로직이 쓰는 LocalDate.now() 가 한국 날짜와 같은지 — 이 테스트의 실질적 목적
    assertThat(LocalDate.now()).isEqualTo(LocalDate.now(KST));
  }
}
