package com.offmode.boundedcontext.room.dto.response;

import com.offmode.boundedcontext.room.types.RoomIconKey;
import com.offmode.boundedcontext.room.types.RoomType;

public record GroupRoomSummaryResponse(
    Long id,
    String name,
    RoomIconKey iconKey,
    RoomType type,
    int memberCount,
    MiniMissionResponse todayMission,
    int verifiedCount,
    int requiredCount) {}
