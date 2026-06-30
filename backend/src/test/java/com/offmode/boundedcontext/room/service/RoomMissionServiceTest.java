package com.offmode.boundedcontext.room.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
import com.offmode.boundedcontext.room.types.MissionSource;
import com.offmode.global.exception.BusinessException;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RoomMissionServiceTest {

  @Mock private RoomMissionRepository missionRepository;
  @Mock private MissionRepository masterMissionRepository;
  @Mock private RoomService roomService;

  private RoomMissionService service() {
    return new RoomMissionService(missionRepository, masterMissionRepository, roomService);
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
