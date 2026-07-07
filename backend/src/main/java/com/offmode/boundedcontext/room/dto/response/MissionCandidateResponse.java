package com.offmode.boundedcontext.room.dto.response;

import com.offmode.boundedcontext.room.entity.RoomMission;

public record MissionCandidateResponse(Long id, String icon, String title) {

  public static MissionCandidateResponse from(RoomMission m) {
    return new MissionCandidateResponse(m.getId(), m.getIcon(), m.getTitle());
  }
}
