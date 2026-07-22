package com.offmode.boundedcontext.room.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.offmode.boundedcontext.mission.entity.Mission;
import com.offmode.boundedcontext.mission.repository.MissionRepository;
import com.offmode.boundedcontext.mission.types.MissionCategory;
import com.offmode.boundedcontext.room.dto.request.SetRoomMissionRequest;
import com.offmode.boundedcontext.room.dto.response.RoomMissionResponse;
import com.offmode.boundedcontext.room.entity.Room;
import com.offmode.boundedcontext.room.entity.RoomMember;
import com.offmode.boundedcontext.room.entity.RoomMission;
import com.offmode.boundedcontext.room.repository.RoomMissionRepository;
import com.offmode.boundedcontext.room.repository.RoomProofRepository;
import com.offmode.boundedcontext.room.types.MissionSource;
import com.offmode.global.exception.BusinessException;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RoomMissionServiceTest {

  @Mock private RoomMissionRepository missionRepository;
  @Mock private MissionRepository masterMissionRepository;
  @Mock private RoomProofRepository proofRepository;
  @Mock private RoomService roomService;

  private RoomMissionService service() {
    return new RoomMissionService(
        missionRepository, masterMissionRepository, proofRepository, roomService);
  }

  @Test
  void setTodayMissionRejectsWhenAlreadySet() {
    Room room = Room.builder().id(2L).build();
    when(roomService.getRoomOrThrow(2L)).thenReturn(room);
    when(roomService.getMembershipOrThrow(2L, 1L)).thenReturn(new RoomMember());
    when(missionRepository.findByRoomIdAndDate(eq(2L), any()))
        .thenReturn(Optional.of(RoomMission.builder().id(99L).build()));

    SetRoomMissionRequest request = request(MissionSource.RANDOM, null, null, null);

    assertThatThrownBy(() -> service().setTodayMission(1L, 2L, request))
        .isInstanceOf(BusinessException.class)
        .hasMessage("오늘 미션이 이미 정해졌습니다.");
  }

  @Test
  void setTodayMissionRandomPicksFromMasterPool() {
    Room room = Room.builder().id(2L).build();
    Mission pooled =
        Mission.builder().id(5L).icon("🚶").text("산책하기").category(MissionCategory.VITALITY).build();
    when(roomService.getRoomOrThrow(2L)).thenReturn(room);
    when(roomService.getMembershipOrThrow(2L, 1L)).thenReturn(new RoomMember());
    when(missionRepository.findByRoomIdAndDate(eq(2L), any())).thenReturn(Optional.empty());
    when(masterMissionRepository.findAll()).thenReturn(List.of(pooled));
    when(missionRepository.save(any(RoomMission.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    RoomMissionResponse response =
        service().setTodayMission(1L, 2L, request(MissionSource.RANDOM, null, null, null));

    assertThat(response.title()).isEqualTo("산책하기");
    assertThat(response.icon()).isEqualTo("🚶");
    assertThat(response.source()).isEqualTo(MissionSource.RANDOM);

    // 랜덤 미션은 master 미션의 카테고리를 그대로 저장한다.
    ArgumentCaptor<RoomMission> captor = ArgumentCaptor.forClass(RoomMission.class);
    verify(missionRepository).save(captor.capture());
    assertThat(captor.getValue().getCategory()).isEqualTo(MissionCategory.VITALITY);
  }

  @Test
  void setTodayMissionRandomWithMissionIdAssignsThatMissionKeepingRandomSource() {
    Room room = Room.builder().id(2L).build();
    Mission chosen =
        Mission.builder()
            .id(7L)
            .icon("📚")
            .text("책 한 권 사기")
            .category(MissionCategory.INTELLECT)
            .build();
    when(roomService.getRoomOrThrow(2L)).thenReturn(room);
    when(roomService.getMembershipOrThrow(2L, 1L)).thenReturn(new RoomMember());
    when(missionRepository.findByRoomIdAndDate(eq(2L), any())).thenReturn(Optional.empty());
    when(masterMissionRepository.findById(7L)).thenReturn(Optional.of(chosen));
    when(missionRepository.save(any(RoomMission.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    RoomMissionResponse response =
        service().setTodayMission(1L, 2L, request(MissionSource.RANDOM, null, null, 7L));

    // 룰렛이 뽑은 특정 미션을 배정하되 source는 RANDOM으로 유지한다.
    assertThat(response.title()).isEqualTo("책 한 권 사기");
    assertThat(response.icon()).isEqualTo("📚");
    assertThat(response.source()).isEqualTo(MissionSource.RANDOM);

    ArgumentCaptor<RoomMission> captor = ArgumentCaptor.forClass(RoomMission.class);
    verify(missionRepository).save(captor.capture());
    assertThat(captor.getValue().getCategory()).isEqualTo(MissionCategory.INTELLECT);
  }

  @Test
  void setTodayMissionRandomWithMissionIdThrowsWhenMasterMissionMissing() {
    Room room = Room.builder().id(2L).build();
    when(roomService.getRoomOrThrow(2L)).thenReturn(room);
    when(roomService.getMembershipOrThrow(2L, 1L)).thenReturn(new RoomMember());
    when(missionRepository.findByRoomIdAndDate(eq(2L), any())).thenReturn(Optional.empty());
    when(masterMissionRepository.findById(404L)).thenReturn(Optional.empty());

    SetRoomMissionRequest request = request(MissionSource.RANDOM, null, null, 404L);

    assertThatThrownBy(() -> service().setTodayMission(1L, 2L, request))
        .isInstanceOf(BusinessException.class)
        .hasMessage("해당 미션을 찾을 수 없습니다.");
  }

  @Test
  void setTodayMissionDirectUsesProvidedTitle() {
    Room room = Room.builder().id(2L).build();
    when(roomService.getRoomOrThrow(2L)).thenReturn(room);
    when(roomService.getMembershipOrThrow(2L, 1L)).thenReturn(new RoomMember());
    when(missionRepository.findByRoomIdAndDate(eq(2L), any())).thenReturn(Optional.empty());
    when(missionRepository.save(any(RoomMission.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    RoomMissionResponse response =
        service().setTodayMission(1L, 2L, request(MissionSource.DIRECT, "노래 들으며 산책", "🎵", null));

    assertThat(response.title()).isEqualTo("노래 들으며 산책");
    assertThat(response.icon()).isEqualTo("🎵");
    assertThat(response.source()).isEqualTo(MissionSource.DIRECT);

    // 자유입력 미션은 카테고리 미분류(null).
    ArgumentCaptor<RoomMission> captor = ArgumentCaptor.forClass(RoomMission.class);
    verify(missionRepository).save(captor.capture());
    assertThat(captor.getValue().getCategory()).isNull();
  }

  @Test
  void updateTodayMissionTitleRenamesWhenNoProofYet() {
    RoomMission mission =
        RoomMission.builder()
            .id(7L)
            .title("원래 미션")
            .icon("🎲")
            .source(MissionSource.RANDOM)
            .category(MissionCategory.VITALITY)
            .build();
    when(roomService.getRoomOrThrow(2L)).thenReturn(Room.builder().id(2L).build());
    when(roomService.getMembershipOrThrow(eq(2L), eq(1L))).thenReturn(RoomMember.builder().build());
    when(missionRepository.findByRoomIdAndDate(eq(2L), any())).thenReturn(Optional.of(mission));
    when(proofRepository.existsByRoomMissionId(7L)).thenReturn(false);
    when(missionRepository.save(any(RoomMission.class))).thenAnswer(inv -> inv.getArgument(0));

    RoomMissionResponse response = service().updateTodayMissionTitle(1L, 2L, "  다듬은 미션  ");

    assertThat(response.title()).isEqualTo("다듬은 미션"); // 앞뒤 공백 제거
    // 제목만 바꾸고 source·category 는 유지한다 (레벨·배지 집계에서 빠지지 않도록)
    assertThat(response.source()).isEqualTo(MissionSource.RANDOM);
    assertThat(mission.getCategory()).isEqualTo(MissionCategory.VITALITY);
  }

  @Test
  void updateTodayMissionTitleRejectsAfterFirstProof() {
    RoomMission mission = RoomMission.builder().id(7L).title("원래 미션").build();
    when(roomService.getRoomOrThrow(2L)).thenReturn(Room.builder().id(2L).build());
    when(roomService.getMembershipOrThrow(eq(2L), eq(1L))).thenReturn(RoomMember.builder().build());
    when(missionRepository.findByRoomIdAndDate(eq(2L), any())).thenReturn(Optional.of(mission));
    when(proofRepository.existsByRoomMissionId(7L)).thenReturn(true);

    assertThatThrownBy(() -> service().updateTodayMissionTitle(1L, 2L, "바꾼 미션"))
        .isInstanceOf(BusinessException.class)
        .hasMessage("이미 인증이 시작돼 미션 이름을 바꿀 수 없습니다.");
  }

  private SetRoomMissionRequest request(
      MissionSource source, String title, String icon, Long missionId) {
    SetRoomMissionRequest request = new SetRoomMissionRequest();
    setField(request, "source", source);
    setField(request, "title", title);
    setField(request, "icon", icon);
    setField(request, "missionId", missionId);
    return request;
  }

  private void setField(Object target, String name, Object value) {
    try {
      var field = target.getClass().getDeclaredField(name);
      field.setAccessible(true);
      field.set(target, value);
    } catch (ReflectiveOperationException e) {
      throw new IllegalStateException(e);
    }
  }
}
