package com.offmode.boundedcontext.mission.app.dto.response;

import java.time.LocalDateTime;

public record UserMissionDto(
    Long id,
    String missionIcon,
    String missionText,
    String missionCategory,
    String status,
    LocalDateTime assignedAt,
    LocalDateTime verifiedAt,
    String photoUrl,
    String caption) {}
