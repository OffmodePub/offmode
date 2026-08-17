package com.offmode.boundedcontext.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.offmode.boundedcontext.badge.repository.UserBadgeRepository;
import com.offmode.boundedcontext.feed.repository.ReactionRepository;
import com.offmode.boundedcontext.feed.repository.VerificationConfirmRepository;
import com.offmode.boundedcontext.feed.repository.VerificationRepository;
import com.offmode.boundedcontext.mission.repository.UserMissionRepository;
import com.offmode.boundedcontext.mission.types.MissionCategory;
import com.offmode.boundedcontext.mission.types.MissionStatus;
import com.offmode.boundedcontext.part.repository.UserPartRepository;
import com.offmode.boundedcontext.room.entity.Room;
import com.offmode.boundedcontext.room.entity.RoomMember;
import com.offmode.boundedcontext.room.repository.RoomMemberRepository;
import com.offmode.boundedcontext.room.repository.RoomNudgeRepository;
import com.offmode.boundedcontext.room.repository.RoomProofConfirmRepository;
import com.offmode.boundedcontext.room.repository.RoomProofReportRepository;
import com.offmode.boundedcontext.room.repository.RoomProofRepository;
import com.offmode.boundedcontext.room.repository.RoomReactionRepository;
import com.offmode.boundedcontext.room.types.ProofStatus;
import com.offmode.boundedcontext.room.types.RoomRole;
import com.offmode.boundedcontext.user.dto.response.UserStatsResponse;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.repository.UserBlockRepository;
import com.offmode.boundedcontext.user.repository.UserRepository;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

  @Mock private UserRepository userRepository;
  @Mock private UserMissionRepository userMissionRepository;
  @Mock private VerificationConfirmRepository verificationConfirmRepository;
  @Mock private ReactionRepository reactionRepository;
  @Mock private VerificationRepository verificationRepository;
  @Mock private UserBadgeRepository userBadgeRepository;
  @Mock private UserPartRepository userPartRepository;
  @Mock private RoomProofRepository roomProofRepository;
  @Mock private RoomReactionRepository roomReactionRepository;
  @Mock private RoomProofConfirmRepository roomProofConfirmRepository;
  @Mock private RoomProofReportRepository roomProofReportRepository;
  @Mock private RoomNudgeRepository roomNudgeRepository;
  @Mock private RoomMemberRepository roomMemberRepository;
  @Mock private UserBlockRepository userBlockRepository;

  // getStats는 개인 미션·방 인증 레포만 사용하므로 나머지 의존성은 null 로 주입한다.
  private UserService service() {
    return new UserService(
        null,
        userMissionRepository,
        null,
        null,
        null,
        null,
        null,
        roomProofRepository,
        null,
        null,
        null,
        null,
        null,
        null);
  }

  // deleteAccount는 모든 자식 레포를 사용하므로 전체 목을 주입한다.
  private UserService fullService() {
    return new UserService(
        userRepository,
        userMissionRepository,
        verificationConfirmRepository,
        reactionRepository,
        verificationRepository,
        userBadgeRepository,
        userPartRepository,
        roomProofRepository,
        roomReactionRepository,
        roomProofConfirmRepository,
        roomProofReportRepository,
        roomNudgeRepository,
        roomMemberRepository,
        userBlockRepository);
  }

  private void stubCategoryCounts() {
    when(userMissionRepository.countByUserIdAndStatusAndMissionCategory(
            eq(1L), eq(MissionStatus.VERIFIED), any()))
        .thenReturn(0L);
  }

  @Test
  void getStats_방인증을_누적_통계에_합산한다() {
    when(userMissionRepository.findByUserIdOrderByAssignedAtDesc(1L))
        .thenReturn(List.of()); // 레거시 0
    when(userMissionRepository.countByUserIdAndStatus(1L, MissionStatus.VERIFIED)).thenReturn(2L);
    stubCategoryCounts();
    when(userMissionRepository.findVerifiedDateTimes(1L, MissionStatus.VERIFIED))
        .thenReturn(List.of());
    when(roomProofRepository.countByUserId(1L)).thenReturn(5L);
    when(roomProofRepository.countByUserIdAndStatus(1L, ProofStatus.VERIFIED)).thenReturn(3L);
    when(roomProofRepository.findVerifiedDatesByUser(1L, ProofStatus.VERIFIED))
        .thenReturn(List.of());

    UserStatsResponse res = service().getStats(1L);

    assertThat(res.getTotalVerified()).isEqualTo(5L); // 레거시 2 + 방 3
    assertThat(res.getTotalMissions()).isEqualTo(5L); // 레거시 0 + 방 5
  }

  @Test
  void getStats_연속달성은_방인증_날짜도_포함한다() {
    when(userMissionRepository.findByUserIdOrderByAssignedAtDesc(1L)).thenReturn(List.of());
    when(userMissionRepository.countByUserIdAndStatus(1L, MissionStatus.VERIFIED)).thenReturn(0L);
    stubCategoryCounts();
    when(userMissionRepository.findVerifiedDateTimes(1L, MissionStatus.VERIFIED))
        .thenReturn(List.of()); // 개인 미션 인증 없음
    when(roomProofRepository.countByUserId(1L)).thenReturn(2L);
    when(roomProofRepository.countByUserIdAndStatus(1L, ProofStatus.VERIFIED)).thenReturn(2L);
    // 오늘 + 어제 방 인증 → 연속 2일
    when(roomProofRepository.findVerifiedDatesByUser(1L, ProofStatus.VERIFIED))
        .thenReturn(List.of(LocalDate.now(), LocalDate.now().minusDays(1)));

    UserStatsResponse res = service().getStats(1L);

    assertThat(res.getStreak()).isEqualTo(2);
  }

  @Test
  void getStats_오늘_미인증이어도_어제까지_이어진_연속달성은_유지된다() {
    when(userMissionRepository.findByUserIdOrderByAssignedAtDesc(1L)).thenReturn(List.of());
    when(userMissionRepository.countByUserIdAndStatus(1L, MissionStatus.VERIFIED)).thenReturn(0L);
    stubCategoryCounts();
    when(userMissionRepository.findVerifiedDateTimes(1L, MissionStatus.VERIFIED))
        .thenReturn(List.of());
    when(roomProofRepository.countByUserId(1L)).thenReturn(3L);
    when(roomProofRepository.countByUserIdAndStatus(1L, ProofStatus.VERIFIED)).thenReturn(3L);
    // 오늘은 아직 인증 전, 어제부터 3일 연속
    when(roomProofRepository.findVerifiedDatesByUser(1L, ProofStatus.VERIFIED))
        .thenReturn(
            List.of(
                LocalDate.now().minusDays(1),
                LocalDate.now().minusDays(2),
                LocalDate.now().minusDays(3)));

    UserStatsResponse res = service().getStats(1L);

    assertThat(res.getStreak()).isEqualTo(3);
  }

  @Test
  void getStats_어제도_인증이_없으면_연속달성은_0이다() {
    when(userMissionRepository.findByUserIdOrderByAssignedAtDesc(1L)).thenReturn(List.of());
    when(userMissionRepository.countByUserIdAndStatus(1L, MissionStatus.VERIFIED)).thenReturn(0L);
    stubCategoryCounts();
    when(userMissionRepository.findVerifiedDateTimes(1L, MissionStatus.VERIFIED))
        .thenReturn(List.of());
    when(roomProofRepository.countByUserId(1L)).thenReturn(1L);
    when(roomProofRepository.countByUserIdAndStatus(1L, ProofStatus.VERIFIED)).thenReturn(1L);
    // 오늘·어제 모두 없음 → 끊긴 기록
    when(roomProofRepository.findVerifiedDatesByUser(1L, ProofStatus.VERIFIED))
        .thenReturn(List.of(LocalDate.now().minusDays(2)));

    UserStatsResponse res = service().getStats(1L);

    assertThat(res.getStreak()).isZero();
  }

  @Test
  void getStats_카테고리_통계에_방인증을_합산한다() {
    when(userMissionRepository.findByUserIdOrderByAssignedAtDesc(1L)).thenReturn(List.of());
    when(userMissionRepository.countByUserIdAndStatus(1L, MissionStatus.VERIFIED)).thenReturn(0L);
    stubCategoryCounts(); // 레거시 카테고리 0
    when(userMissionRepository.findVerifiedDateTimes(1L, MissionStatus.VERIFIED))
        .thenReturn(List.of());
    when(roomProofRepository.countByUserId(1L)).thenReturn(0L);
    when(roomProofRepository.countByUserIdAndStatus(1L, ProofStatus.VERIFIED)).thenReturn(0L);
    when(roomProofRepository.findVerifiedDatesByUser(1L, ProofStatus.VERIFIED))
        .thenReturn(List.of());
    when(roomProofRepository.countByUserIdAndStatusAndRoomMissionCategory(
            1L, ProofStatus.VERIFIED, MissionCategory.ENERGY))
        .thenReturn(0L);
    when(roomProofRepository.countByUserIdAndStatusAndRoomMissionCategory(
            1L, ProofStatus.VERIFIED, MissionCategory.INTELLECT))
        .thenReturn(0L);
    // 방 인증 VITALITY 5건 → vitality level 1 / fill 50
    when(roomProofRepository.countByUserIdAndStatusAndRoomMissionCategory(
            1L, ProofStatus.VERIFIED, MissionCategory.VITALITY))
        .thenReturn(5L);

    UserStatsResponse res = service().getStats(1L);

    assertThat(res.getVitalityFill()).isEqualTo(50);
    assertThat(res.getVitalityLevel()).isEqualTo(1);
  }

  @Test
  void deleteAccount_차단_행을_유저_삭제_전에_정리한다() {
    fullService().deleteAccount(1L);

    // 차단 행 정리가 호출되고, 그 시점이 유저 엔티티 삭제보다 앞선다 (users FK 제약 해소)
    verify(userBlockRepository).deleteAllByUser(1L);
    InOrder order = inOrder(userBlockRepository, userRepository);
    order.verify(userBlockRepository).deleteAllByUser(1L);
    order.verify(userRepository).deleteById(1L);
  }

  @Test
  void deleteAccount_방_도메인_자식행을_FK안전순서로_유저삭제전에_정리한다() {
    fullService().deleteAccount(1L);

    // 방 자식 → 인증 → 멤버십 순으로 지우고, 모두 users 엔티티 삭제보다 앞서야 FK 위반이 없다.
    InOrder order =
        inOrder(
            roomReactionRepository,
            roomProofConfirmRepository,
            roomProofReportRepository,
            roomNudgeRepository,
            roomProofRepository,
            roomMemberRepository,
            userRepository);
    order.verify(roomReactionRepository).deleteByUserId(1L);
    order.verify(roomReactionRepository).deleteByProofOwnerUserId(1L);
    order.verify(roomProofConfirmRepository).deleteByUserId(1L);
    order.verify(roomProofConfirmRepository).deleteByProofOwnerUserId(1L);
    order.verify(roomProofReportRepository).deleteByReporterId(1L);
    order.verify(roomProofReportRepository).deleteByProofOwnerUserId(1L);
    order.verify(roomNudgeRepository).deleteAllByUser(1L);
    order.verify(roomProofRepository).deleteByUserId(1L);
    order.verify(roomMemberRepository).deleteByUserId(1L);
    order.verify(userRepository).deleteById(1L);
  }

  @Test
  void deleteAccount_owner방은_가장먼저들어온_남은멤버에게_위임한다() {
    User me = User.builder().id(1L).build();
    User other = User.builder().id(2L).build();
    Room room = Room.builder().id(10L).build();
    RoomMember myOwnership = RoomMember.builder().room(room).user(me).role(RoomRole.OWNER).build();
    RoomMember next = RoomMember.builder().room(room).user(other).role(RoomRole.MEMBER).build();

    when(roomMemberRepository.findWithRoomByUserId(1L)).thenReturn(List.of(myOwnership));
    when(roomMemberRepository.findByRoomIdOrderByJoinedAtAsc(10L))
        .thenReturn(List.of(myOwnership, next));

    fullService().deleteAccount(1L);

    // 남은 멤버가 방장으로 승격되고, 그 뒤에 내 멤버십이 일괄 삭제된다.
    assertThat(next.getRole()).isEqualTo(RoomRole.OWNER);
    InOrder order = inOrder(roomMemberRepository);
    order.verify(roomMemberRepository).save(next);
    order.verify(roomMemberRepository).deleteByUserId(1L);
  }
}
