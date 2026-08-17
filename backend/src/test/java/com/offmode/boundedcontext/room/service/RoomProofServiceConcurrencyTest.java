package com.offmode.boundedcontext.room.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.offmode.boundedcontext.badge.entity.UserBadge;
import com.offmode.boundedcontext.badge.repository.UserBadgeRepository;
import com.offmode.boundedcontext.room.entity.Room;
import com.offmode.boundedcontext.room.entity.RoomMember;
import com.offmode.boundedcontext.room.entity.RoomMission;
import com.offmode.boundedcontext.room.entity.RoomProof;
import com.offmode.boundedcontext.room.repository.RoomMemberRepository;
import com.offmode.boundedcontext.room.repository.RoomMissionRepository;
import com.offmode.boundedcontext.room.repository.RoomProofConfirmRepository;
import com.offmode.boundedcontext.room.repository.RoomProofRepository;
import com.offmode.boundedcontext.room.repository.RoomRepository;
import com.offmode.boundedcontext.room.types.MissionSource;
import com.offmode.boundedcontext.room.types.ProofStatus;
import com.offmode.boundedcontext.room.types.RoomIconKey;
import com.offmode.boundedcontext.room.types.RoomRole;
import com.offmode.boundedcontext.room.types.RoomType;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.repository.UserRepository;
import java.time.LocalDate;
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
 * 인증 상태 전환 동시성 검증 — 같은 인증에 confirm 이 몰리거나 확인과 나가기가 겹쳐도, 임계치 판정과 진급/뱃지 처리는 정확히 한 번만 일어나야 한다.
 *
 * <p>스레드 간 커밋 가시성이 필요하므로 테스트에 @Transactional 을 붙이지 않는다 (각 서비스 호출이 자체 트랜잭션으로 커밋된다).
 */
@ActiveProfiles("dev")
@SpringBootTest
@TestPropertySource(
    properties = {
      "spring.datasource.url=jdbc:h2:mem:room-proof-concurrency-test;MODE=MySQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000",
      "spring.jpa.hibernate.ddl-auto=validate",
      "spring.flyway.locations=classpath:db/migration/h2",
      "spring.sql.init.mode=never"
    })
class RoomProofServiceConcurrencyTest {

  @Autowired private RoomProofService proofService;
  @Autowired private RoomService roomService;
  @Autowired private UserRepository userRepository;
  @Autowired private RoomRepository roomRepository;
  @Autowired private RoomMemberRepository memberRepository;
  @Autowired private RoomMissionRepository missionRepository;
  @Autowired private RoomProofRepository proofRepository;
  @Autowired private RoomProofConfirmRepository confirmRepository;
  @Autowired private UserBadgeRepository userBadgeRepository;

  @Test
  void concurrentConfirmsFromTwoMembersVerifyProofExactlyOnce() throws Exception {
    // GROUP 방 3명(requiredConfirm=2) — 확인자 2명이 동시에 confirm 하면 정확히 한 번만 VERIFIED 전환
    Fixture f = createGroupRoomWithProof("room-c1", 2);

    List<Throwable> errors =
        runConcurrently(
            () -> proofService.confirm(f.confirmerA.getId(), f.room.getId(), f.proof.getId()),
            () -> proofService.confirm(f.confirmerB.getId(), f.room.getId(), f.proof.getId()));

    assertThat(errors).isEmpty();
    RoomProof reloaded = proofRepository.findById(f.proof.getId()).orElseThrow();
    assertThat(reloaded.getStatus()).isEqualTo(ProofStatus.VERIFIED);
    assertThat(confirmRepository.countByRoomProofId(f.proof.getId())).isEqualTo(2);
    assertBadgesNotDuplicated(f.uploader.getId());
  }

  @Test
  void concurrentDoubleTapFromSameMemberStaysIdempotent() throws Exception {
    // 같은 확인자의 동시 이중 탭 — 멱등 계약(에러 없음) 유지 + confirm 은 1건만 저장
    Fixture f = createGroupRoomWithProof("room-c2", 2);

    List<Throwable> errors =
        runConcurrently(
            () -> proofService.confirm(f.confirmerA.getId(), f.room.getId(), f.proof.getId()),
            () -> proofService.confirm(f.confirmerA.getId(), f.room.getId(), f.proof.getId()));

    assertThat(errors).isEmpty();
    assertThat(confirmRepository.countByRoomProofId(f.proof.getId())).isEqualTo(1);
    RoomProof reloaded = proofRepository.findById(f.proof.getId()).orElseThrow();
    assertThat(reloaded.getStatus()).isEqualTo(ProofStatus.PENDING);
  }

  @Test
  void concurrentReactionTogglesDoNotFailWithUniqueViolation() throws Exception {
    // 같은 이모지 동시 토글 — UNIQUE 위반 500 없이 직렬화된다 (토글 2회 = 원상복귀 시맨틱)
    Fixture f = createGroupRoomWithProof("room-c3", 2);

    List<Throwable> errors =
        runConcurrently(
            () ->
                proofService.toggleReaction(
                    f.confirmerA.getId(), f.room.getId(), f.proof.getId(), "🔥"),
            () ->
                proofService.toggleReaction(
                    f.confirmerA.getId(), f.room.getId(), f.proof.getId(), "🔥"));

    assertThat(errors).isEmpty();
  }

  @Test
  void leavingWhileAnotherMemberConfirmsStillVerifiesExactlyOnce() throws Exception {
    // 3명 방(requiredConfirm=2)에서 한 명이 나가는 동시에 다른 한 명이 확인한다.
    // 인증 행 락이 두 경로를 직렬화하므로 어느 순서가 되든 결과는 "2명 + 확인 1건" 이고,
    // 요구치가 1로 낮아졌으니 최종 상태는 VERIFIED 여야 한다.
    //  - confirm 이 먼저면: 아직 3명이라 미달로 두고 커밋 → 나가기의 재판정이 완료 처리
    //  - 나가기가 먼저면: 확인 0건이라 미달로 두고 커밋 → confirm 이 2명 기준으로 완료 처리
    // 어느 쪽이든 진급·뱃지는 한 번만 실행되어야 한다.
    Fixture f = createGroupRoomWithProof("room-c4", 2);

    List<Throwable> errors =
        runConcurrently(
            () -> proofService.confirm(f.confirmerA.getId(), f.room.getId(), f.proof.getId()),
            () -> roomService.leave(f.confirmerB.getId(), f.room.getId()));

    assertThat(errors).isEmpty();
    RoomProof reloaded = proofRepository.findById(f.proof.getId()).orElseThrow();
    assertThat(reloaded.getStatus()).isEqualTo(ProofStatus.VERIFIED);
    assertThat(confirmRepository.countByRoomProofId(f.proof.getId())).isEqualTo(1);
    assertThat(memberRepository.countByRoomId(f.room.getId())).isEqualTo(2);
    assertBadgesNotDuplicated(f.uploader.getId());
  }

  // ===== 픽스처/헬퍼 =====

  private record Fixture(
      User uploader, User confirmerA, User confirmerB, Room room, RoomProof proof) {}

  private Fixture createGroupRoomWithProof(String tag, int requiredConfirm) {
    User uploader = saveUser(tag + "-uploader");
    User confirmerA = saveUser(tag + "-confirmer-a");
    User confirmerB = saveUser(tag + "-confirmer-b");

    Room room =
        roomRepository.save(
            Room.builder()
                .name("동시성 테스트 방")
                .iconKey(RoomIconKey.FIRE)
                .type(RoomType.GROUP)
                .build());
    memberRepository.save(
        RoomMember.builder().room(room).user(uploader).role(RoomRole.OWNER).build());
    memberRepository.save(
        RoomMember.builder().room(room).user(confirmerA).role(RoomRole.MEMBER).build());
    memberRepository.save(
        RoomMember.builder().room(room).user(confirmerB).role(RoomRole.MEMBER).build());

    RoomMission mission =
        missionRepository.save(
            RoomMission.builder()
                .room(room)
                .date(LocalDate.now())
                .title("산책하기")
                .icon("🔥")
                .source(MissionSource.DIRECT)
                .build());
    RoomProof proof =
        proofRepository.save(
            RoomProof.builder()
                .roomMission(mission)
                .user(uploader)
                .photoUrl("/uploads/test.jpg")
                .status(ProofStatus.PENDING)
                .build());
    return new Fixture(uploader, confirmerA, confirmerB, room, proof);
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
