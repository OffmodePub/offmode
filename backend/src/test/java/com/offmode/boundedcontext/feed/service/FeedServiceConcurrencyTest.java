package com.offmode.boundedcontext.feed.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.offmode.boundedcontext.badge.entity.UserBadge;
import com.offmode.boundedcontext.badge.repository.UserBadgeRepository;
import com.offmode.boundedcontext.feed.entity.Verification;
import com.offmode.boundedcontext.feed.repository.VerificationConfirmRepository;
import com.offmode.boundedcontext.feed.repository.VerificationRepository;
import com.offmode.boundedcontext.mission.entity.UserMission;
import com.offmode.boundedcontext.mission.repository.UserMissionRepository;
import com.offmode.boundedcontext.mission.types.MissionCategory;
import com.offmode.boundedcontext.mission.types.MissionStatus;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.repository.UserRepository;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.status.ErrorStatus;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * 피드 피어 인증(confirm) 동시성 검증 — 임계치 도달 시 미션 VERIFIED 전환·레벨업·뱃지 수여가 정확히 한 번만 일어나야 한다.
 *
 * <p>스레드 간 커밋 가시성이 필요하므로 테스트에 @Transactional 을 붙이지 않는다.
 */
@ActiveProfiles("dev")
@SpringBootTest
@TestPropertySource(
    properties = {
      "spring.datasource.url=jdbc:h2:mem:feed-concurrency-test;MODE=MySQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000",
      "spring.jpa.hibernate.ddl-auto=validate",
      "spring.flyway.locations=classpath:db/migration/h2",
      "spring.sql.init.mode=never"
    })
class FeedServiceConcurrencyTest {

  @Autowired private FeedService feedService;
  @Autowired private UserRepository userRepository;
  @Autowired private UserMissionRepository userMissionRepository;
  @Autowired private VerificationRepository verificationRepository;
  @Autowired private VerificationConfirmRepository confirmRepository;
  @Autowired private UserBadgeRepository userBadgeRepository;

  @Test
  void concurrentConfirmsFromTwoUsersVerifyMissionExactlyOnce() throws Exception {
    // 임계치(1) 도달 confirm 이 동시에 2건 — 미션 전환·뱃지 수여는 한 번만, 예외 없음
    Fixture f = createPendingVerification("feed-c1");

    List<Throwable> errors =
        runConcurrently(
            () -> feedService.confirm(f.confirmerA.getId(), f.verification.getId()),
            () -> feedService.confirm(f.confirmerB.getId(), f.verification.getId()));

    assertThat(errors).isEmpty();
    UserMission reloaded = userMissionRepository.findById(f.mission.getId()).orElseThrow();
    assertThat(reloaded.getStatus()).isEqualTo(MissionStatus.VERIFIED);
    assertThat(reloaded.getVerifiedAt()).isNotNull();
    assertThat(confirmRepository.countByVerificationId(f.verification.getId())).isEqualTo(2);
    assertBadgesNotDuplicated(f.owner.getId());
  }

  @Test
  void concurrentDoubleTapFromSameUserSavesSingleConfirm() throws Exception {
    // 같은 유저 동시 이중 탭 — 한쪽만 성공하고 다른 쪽은 409 계약(이미 인증)으로 떨어진다. 500 은 없어야 한다.
    Fixture f = createPendingVerification("feed-c2");

    List<Throwable> errors =
        runConcurrently(
            () -> feedService.confirm(f.confirmerA.getId(), f.verification.getId()),
            () -> feedService.confirm(f.confirmerA.getId(), f.verification.getId()));

    assertThat(errors)
        .hasSize(1)
        .allSatisfy(
            error ->
                assertThat(error)
                    .isInstanceOf(BusinessException.class)
                    .extracting(e -> ((BusinessException) e).getErrorStatus())
                    .isEqualTo(ErrorStatus.VERIFICATION_ALREADY_CONFIRMED));
    assertThat(confirmRepository.countByVerificationId(f.verification.getId())).isEqualTo(1);
  }

  @Test
  void concurrentReactionTogglesDoNotFailWithUniqueViolation() throws Exception {
    // 같은 이모지 동시 토글 — UNIQUE 위반 500 없이 직렬화된다
    Fixture f = createPendingVerification("feed-c3");

    List<Throwable> errors =
        runConcurrently(
            () -> feedService.react(f.confirmerA.getId(), f.verification.getId(), "🔥"),
            () -> feedService.react(f.confirmerA.getId(), f.verification.getId(), "🔥"));

    assertThat(errors).isEmpty();
  }

  // ===== 픽스처/헬퍼 =====

  private record Fixture(
      User owner,
      User confirmerA,
      User confirmerB,
      UserMission mission,
      Verification verification) {}

  private Fixture createPendingVerification(String tag) {
    User owner = saveUser(tag + "-owner");
    User confirmerA = saveUser(tag + "-confirmer-a");
    User confirmerB = saveUser(tag + "-confirmer-b");

    UserMission mission =
        userMissionRepository.save(
            UserMission.builder()
                .user(owner)
                .missionIcon("🔥")
                .missionText("산책하기 " + tag)
                .missionCategory(MissionCategory.VITALITY)
                .status(MissionStatus.PENDING)
                .build());
    Verification verification =
        verificationRepository.save(
            Verification.builder()
                .userMission(mission)
                .user(owner)
                .photoUrl("/uploads/test.jpg")
                .build());
    return new Fixture(owner, confirmerA, confirmerB, mission, verification);
  }

  private User saveUser(String providerId) {
    return userRepository.save(User.builder().provider("test").providerId(providerId).build());
  }

  private void assertBadgesNotDuplicated(Long userId) {
    List<UserBadge> badges = userBadgeRepository.findByUserId(userId);
    Set<String> distinctKeys =
        badges.stream().map(UserBadge::getBadgeKey).collect(Collectors.toSet());
    assertThat(badges).hasSameSizeAs(distinctKeys);
  }

  // 모든 작업을 같은 순간에 출발시키고, 각 스레드의 예외를 수집해 반환한다.
  private List<Throwable> runConcurrently(Runnable... tasks) throws InterruptedException {
    ExecutorService pool = Executors.newFixedThreadPool(tasks.length);
    CountDownLatch ready = new CountDownLatch(tasks.length);
    CountDownLatch start = new CountDownLatch(1);
    List<Throwable> errors = Collections.synchronizedList(new ArrayList<>());
    for (Runnable task : tasks) {
      pool.execute(
          () -> {
            ready.countDown();
            try {
              start.await();
              task.run();
            } catch (Throwable t) {
              errors.add(t);
            }
          });
    }
    ready.await();
    start.countDown();
    pool.shutdown();
    assertThat(pool.awaitTermination(30, TimeUnit.SECONDS)).isTrue();
    return errors;
  }
}
