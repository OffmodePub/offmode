package com.offmode.boundedcontext.mission.dto.response;

import com.offmode.boundedcontext.mission.types.MissionCategory;
import com.offmode.boundedcontext.mission.types.MissionStatus;
import java.time.LocalDateTime;

public record UserMissionResponse(
    Long id,
    String missionIcon,
    String missionText,
    String missionCategory,
    String status,
    LocalDateTime assignedAt,
    LocalDateTime verifiedAt,
    String photoUrl,
    String caption) {

  public UserMissionResponse(
      Long id,
      String missionIcon,
      String missionText,
      MissionCategory missionCategory,
      MissionStatus status,
      LocalDateTime assignedAt,
      LocalDateTime verifiedAt,
      String photoUrl,
      String caption) {
    this(
        id,
        missionIcon,
        missionText,
        missionCategory.value(),
        status.value(),
        assignedAt,
        verifiedAt,
        photoUrl,
        caption);
  }
}
