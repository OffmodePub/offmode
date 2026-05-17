package com.offmode.boundedcontext.mission.dto.response;

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
    String caption) {}
