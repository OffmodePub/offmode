package com.offmode.boundedcontext.room.dto.response;

import com.offmode.boundedcontext.mission.entity.Mission;

public record MissionCandidateResponse(Long id, String icon, String title) {

  public static MissionCandidateResponse from(Mission m) {
    return new MissionCandidateResponse(m.getId(), m.getIcon(), m.getText());
  }
}
