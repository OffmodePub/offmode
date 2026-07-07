---
paths:
  - "backend/src/test/**/*.java"
---

# 백엔드 테스트 컨벤션

테스트는 3계층으로 나뉜다. 새 테스트를 쓸 때는 아래 기준으로 계층을 고르고, 각 계층의 대표 파일 패턴을 그대로 따른다.

## 1. 서비스 단위 테스트 — Mockito

- 대상: 서비스 클래스의 분기/예외 로직. 도메인 서비스마다 1:1로 존재해야 한다.
- 패턴: `@ExtendWith(MockitoExtension.class)` + `@Mock` 리포지토리/협력자, 생성자 직접 호출로 서비스 조립 (`service()` 팩토리 메서드).
- 예외 검증은 `assertThatThrownBy(...).isInstanceOf(BusinessException.class).hasMessage("한국어 메시지 그대로")`.
- 대표 파일: `room/service/RoomProofServiceTest.java`, `feed/service/FeedServiceTest.java`

## 2. 컨트롤러 테스트 — @WebMvcTest

- 대상: 요청 검증(@Valid)·인가·직렬화 경로.
- 패턴: `@WebMvcTest(XxxController.class)` + `@Import({SecurityConfig, JwtAuthFilter})` + `@MockitoBean` 서비스/JwtProvider, `Bearer token` 헤더로 인증 유저 주입.
- 필수 케이스: ① 정상 응답(아래 응답 규칙 준수 확인) ② @Valid 위반 400 ③ 서비스 BusinessException → `{isSuccess:false, code, message}` 포맷 + 한국어 메시지 문자열 비교 ④ 비인증 401 `COMMON_401`.
- 응답 규칙: 일반 200 + DTO / 단건 없음 204 본문 없음 / **빈 목록은 204가 아니라 `[]` 200**.
- 대표 파일: `feed/api/v1/FeedControllerTest.java`

## 3. 통합·동시성 테스트 — @SpringBootTest + H2

- 대상: 실제 DB가 필요한 검증 (Flyway 스키마, 트랜잭션 경계, 락/race condition).
- 패턴: `@ActiveProfiles("dev")` + `@SpringBootTest` + `@TestPropertySource`로 **클래스별 고유 이름의 in-mem H2** 지정:
  ```
  spring.datasource.url=jdbc:h2:mem:<고유이름>;MODE=MySQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000
  spring.jpa.hibernate.ddl-auto=validate
  spring.flyway.locations=classpath:db/migration/h2
  spring.sql.init.mode=never
  ```
- **동시성 테스트에는 절대 `@Transactional`을 붙이지 않는다** — 스레드 간 커밋 가시성이 사라져 테스트가 무의미해진다. 데이터 격리는 클래스별 고유 DB + 테스트별 고유 픽스처(providerId 등)로 한다.
- 동시 실행은 `CountDownLatch`(ready/start 2단)로 같은 순간 출발시키고, `pool.shutdown()` + `awaitTermination` 대기, 각 스레드의 예외를 리스트로 수집해 assert한다.
- 대표 파일: `room/service/RoomProofServiceConcurrencyTest.java`, `feed/service/FeedServiceConcurrencyTest.java`, `global/config/FlywayMigrationTest.java`

## 공통

- 검증 순서: `./gradlew spotlessApply` → `./gradlew test`. 커밋 전 spotlessCheck·test 통과 필수.
- JaCoCo 리포트가 `test` 후 자동 생성된다 (`build/reports/jacoco/test/`). 커버리지 게이트는 없지만 새 서비스/컨트롤러에 테스트 없이 머지하지 않는다.
