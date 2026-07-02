package com.offmode.boundedcontext.room.dto.response;

import com.offmode.boundedcontext.room.entity.RoomMission;
import com.offmode.boundedcontext.room.types.MissionSource;
import java.time.LocalDate;

public record RoomMissionResponse(
    Long id, LocalDate date, String icon, String title, MissionSource source) {

  public static RoomMissionResponse from(RoomMission m) {
    return new RoomMissionResponse(
        m.getId(), m.getDate(), m.getIcon(), m.getTitle(), m.getSource());
  }
}
