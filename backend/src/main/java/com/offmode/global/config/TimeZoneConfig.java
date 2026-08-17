package com.offmode.global.config;

import jakarta.annotation.PostConstruct;
import java.time.ZoneId;
import java.util.TimeZone;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;

/**
 * 서비스 기준 시각을 한국 시간(KST)으로 고정한다.
 *
 * <p>미션·인증·스트릭은 모두 "오늘이 며칠인가"로 판정하고, 그 판정은 {@code LocalDate.now()} 등 JVM 기본 타임존에 기댄다. 운영
 * 컨테이너(alpine JRE)의 기본값은 UTC 라서 고정하지 않으면 한국시간 00:00~09:00 구간 동안 서버가 '어제'로 동작한다 — 새벽에 정한 방 미션이 전날
 * 날짜로 저장되고, 인증이 어제 미션에 붙고, 스트릭·월별 기록이 하루씩 밀린다.
 *
 * <p>{@code Dockerfile} 에서 {@code -Duser.timezone} 으로도 넘기지만, 로컬·CI·테스트까지 같은 기준으로 돌도록 애플리케이션 레벨에서 한
 * 번 더 못 박는다.
 */
@Slf4j
@Configuration
public class TimeZoneConfig {

  /** 서비스 기준 타임존. 날짜 경계가 필요한 곳에서 명시적으로 참조할 수 있도록 공개한다. */
  public static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");

  @PostConstruct
  void applyServiceTimeZone() {
    TimeZone before = TimeZone.getDefault();
    TimeZone.setDefault(TimeZone.getTimeZone(SERVICE_ZONE));
    log.info("서비스 기본 타임존 고정: {} -> {}", before.getID(), SERVICE_ZONE);
  }
}
