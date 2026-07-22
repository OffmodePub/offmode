package com.offmode.boundedcontext.room.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.offmode.boundedcontext.room.dto.request.JoinRoomRequest;
import com.offmode.boundedcontext.room.dto.response.NudgeResponse;
import com.offmode.boundedcontext.room.entity.Room;
import com.offmode.boundedcontext.room.entity.RoomMember;
import com.offmode.boundedcontext.room.entity.RoomMission;
import com.offmode.boundedcontext.room.entity.RoomNudge;
import com.offmode.boundedcontext.room.entity.RoomProof;
import com.offmode.boundedcontext.room.repository.RoomMemberRepository;
import com.offmode.boundedcontext.room.repository.RoomMissionRepository;
import com.offmode.boundedcontext.room.repository.RoomNudgeRepository;
import com.offmode.boundedcontext.room.repository.RoomProofRepository;
import com.offmode.boundedcontext.room.repository.RoomRepository;
import com.offmode.boundedcontext.room.types.ProofStatus;
import com.offmode.boundedcontext.room.types.RoomRole;
import com.offmode.boundedcontext.room.types.RoomType;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.service.BlockService;
import com.offmode.boundedcontext.user.service.UserService;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.push.PushService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RoomServiceTest {

  @Mock private RoomRepository roomRepository;
  @Mock private RoomMemberRepository memberRepository;
  @Mock private RoomMissionRepository missionRepository;
  @Mock private RoomProofRepository proofRepository;
  @Mock private RoomNudgeRepository nudgeRepository;
  @Mock private UserService userService;
  @Mock private RoomProofAssembler proofAssembler;
  @Mock private BlockService blockService;
  @Mock private PushService pushService;

  private RoomService service() {
    return new RoomService(
        roomRepository,
        memberRepository,
        missionRepository,
        proofRepository,
        nudgeRepository,
        userService,
        proofAssembler,
        blockService,
        pushService);
  }

  @Test
  void joinRejectsUnknownInviteCode() {
    when(roomRepository.findByInviteCode("OFF999")).thenReturn(Optional.empty());
    JoinRoomRequest request = request("OFF999");

    assertThatThrownBy(() -> service().join(1L, request))
        .isInstanceOf(BusinessException.class)
        .hasMessage("초대코드에 해당하는 방이 없습니다.");
  }

  @Test
  void joinRejectsAlreadyJoinedRoom() {
    Room room = Room.builder().id(2L).type(RoomType.GROUP).inviteCode("OFF111").build();
    when(roomRepository.findByInviteCode("OFF111")).thenReturn(Optional.of(room));
    when(memberRepository.existsByRoomIdAndUserId(2L, 1L)).thenReturn(true);
    JoinRoomRequest request = request("OFF111");

    assertThatThrownBy(() -> service().join(1L, request))
        .isInstanceOf(BusinessException.class)
        .hasMessage("이미 참여한 방입니다.");
  }

  @Test
  void requiredConfirmIsMemberCountMinusOneForGroupAndZeroForSolo() {
    RoomService service = service();
    assertThat(service.requiredConfirm(RoomType.GROUP, 4)).isEqualTo(3);
    assertThat(service.requiredConfirm(RoomType.GROUP, 1)).isEqualTo(0);
    assertThat(service.requiredConfirm(RoomType.SOLO, 1)).isEqualTo(0);
  }

  @Test
  void leaveTransfersOwnershipToEarliestRemainingMember() {
    Room room = Room.builder().id(2L).type(RoomType.GROUP).build();
    User owner = User.builder().id(1L).provider("kakao").providerId("owner").build();
    RoomMember ownerMember =
        RoomMember.builder().id(10L).room(room).user(owner).role(RoomRole.OWNER).build();
    User next = User.builder().id(2L).provider("kakao").providerId("next").build();
    RoomMember nextMember =
        RoomMember.builder().id(11L).room(room).user(next).role(RoomRole.MEMBER).build();

    when(roomRepository.findById(2L)).thenReturn(Optional.of(room));
    when(memberRepository.findByRoomIdAndUserId(2L, 1L)).thenReturn(Optional.of(ownerMember));
    when(memberRepository.findByRoomIdOrderByJoinedAtAsc(2L)).thenReturn(List.of(nextMember));

    service().leave(1L, 2L);

    verify(memberRepository).delete(ownerMember);
    ArgumentCaptor<RoomMember> captor = ArgumentCaptor.forClass(RoomMember.class);
    verify(memberRepository).save(captor.capture());
    assertThat(captor.getValue().getRole()).isEqualTo(RoomRole.OWNER);
    assertThat(captor.getValue().getId()).isEqualTo(11L);
  }

  @Test
  void nudgeRejectsNudgingYourself() {
    Room room = Room.builder().id(2L).type(RoomType.GROUP).build();
    User me = User.builder().id(1L).provider("kakao").providerId("me").build();
    RoomMember myMembership =
        RoomMember.builder().id(10L).room(room).user(me).role(RoomRole.OWNER).build();

    when(roomRepository.findById(2L)).thenReturn(Optional.of(room));
    when(memberRepository.findByRoomIdAndUserId(2L, 1L)).thenReturn(Optional.of(myMembership));
    when(memberRepository.findByIdAndRoomId(10L, 2L)).thenReturn(Optional.of(myMembership));

    assertThatThrownBy(() -> service().nudge(1L, 2L, 10L))
        .isInstanceOf(BusinessException.class)
        .hasMessage("자기 자신을 콕 찌를 수 없습니다.");
  }

  @Test
  void nudgeRejectsWhenTargetAlreadyVerified() {
    Room room = Room.builder().id(2L).type(RoomType.GROUP).build();
    User me = User.builder().id(1L).provider("kakao").providerId("me").build();
    RoomMember myMembership =
        RoomMember.builder().id(10L).room(room).user(me).role(RoomRole.OWNER).build();
    User targetUser = User.builder().id(2L).provider("kakao").providerId("t").build();
    RoomMember target =
        RoomMember.builder().id(11L).room(room).user(targetUser).role(RoomRole.MEMBER).build();
    RoomMission mission = RoomMission.builder().id(50L).build();
    RoomProof proof = RoomProof.builder().status(ProofStatus.VERIFIED).build();

    when(roomRepository.findById(2L)).thenReturn(Optional.of(room));
    when(memberRepository.findByRoomIdAndUserId(2L, 1L)).thenReturn(Optional.of(myMembership));
    when(memberRepository.findByIdAndRoomId(11L, 2L)).thenReturn(Optional.of(target));
    when(missionRepository.findByRoomIdAndDate(eq(2L), any())).thenReturn(Optional.of(mission));
    when(proofRepository.findByRoomMissionIdAndUserId(50L, 2L)).thenReturn(Optional.of(proof));

    assertThatThrownBy(() -> service().nudge(1L, 2L, 11L))
        .isInstanceOf(BusinessException.class)
        .hasMessage("이미 인증을 완료한 멤버입니다.");
    verify(nudgeRepository, never()).save(any(RoomNudge.class));
  }

  @Test
  void nudgeSavesWhenTargetHasNotVerified() {
    Room room = Room.builder().id(2L).type(RoomType.GROUP).build();
    User me = User.builder().id(1L).provider("kakao").providerId("me").build();
    RoomMember myMembership =
        RoomMember.builder().id(10L).room(room).user(me).role(RoomRole.OWNER).build();
    User targetUser = User.builder().id(2L).provider("kakao").providerId("t").build();
    RoomMember target =
        RoomMember.builder().id(11L).room(room).user(targetUser).role(RoomRole.MEMBER).build();
    RoomMission mission = RoomMission.builder().id(50L).build();

    when(roomRepository.findById(2L)).thenReturn(Optional.of(room));
    when(memberRepository.findByRoomIdAndUserId(2L, 1L)).thenReturn(Optional.of(myMembership));
    when(memberRepository.findByIdAndRoomId(11L, 2L)).thenReturn(Optional.of(target));
    when(missionRepository.findByRoomIdAndDate(eq(2L), any())).thenReturn(Optional.of(mission));
    when(proofRepository.findByRoomMissionIdAndUserId(50L, 2L)).thenReturn(Optional.empty());
    when(nudgeRepository.existsByRoomMissionIdAndFromUserIdAndToUserId(50L, 1L, 2L))
        .thenReturn(false);

    NudgeResponse res = service().nudge(1L, 2L, 11L);

    assertThat(res.memberId()).isEqualTo(11L);
    assertThat(res.nudged()).isTrue();
    verify(nudgeRepository).save(any(RoomNudge.class));
  }

  @Test
  void nudgeIsIdempotentWhenAlreadyNudged() {
    Room room = Room.builder().id(2L).type(RoomType.GROUP).build();
    User me = User.builder().id(1L).provider("kakao").providerId("me").build();
    RoomMember myMembership =
        RoomMember.builder().id(10L).room(room).user(me).role(RoomRole.OWNER).build();
    User targetUser = User.builder().id(2L).provider("kakao").providerId("t").build();
    RoomMember target =
        RoomMember.builder().id(11L).room(room).user(targetUser).role(RoomRole.MEMBER).build();
    RoomMission mission = RoomMission.builder().id(50L).build();

    when(roomRepository.findById(2L)).thenReturn(Optional.of(room));
    when(memberRepository.findByRoomIdAndUserId(2L, 1L)).thenReturn(Optional.of(myMembership));
    when(memberRepository.findByIdAndRoomId(11L, 2L)).thenReturn(Optional.of(target));
    when(missionRepository.findByRoomIdAndDate(eq(2L), any())).thenReturn(Optional.of(mission));
    when(proofRepository.findByRoomMissionIdAndUserId(50L, 2L)).thenReturn(Optional.empty());
    when(nudgeRepository.existsByRoomMissionIdAndFromUserIdAndToUserId(50L, 1L, 2L))
        .thenReturn(true);

    NudgeResponse res = service().nudge(1L, 2L, 11L);

    assertThat(res.nudged()).isTrue();
    verify(nudgeRepository, never()).save(any(RoomNudge.class));
  }

  private JoinRoomRequest request(String inviteCode) {
    JoinRoomRequest request = new JoinRoomRequest();
    try {
      var field = JoinRoomRequest.class.getDeclaredField("inviteCode");
      field.setAccessible(true);
      field.set(request, inviteCode);
    } catch (ReflectiveOperationException e) {
      throw new IllegalStateException(e);
    }
    return request;
  }
}
