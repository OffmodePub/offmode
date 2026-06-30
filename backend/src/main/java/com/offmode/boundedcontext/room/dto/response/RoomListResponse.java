package com.offmode.boundedcontext.room.dto.response;

import java.util.List;

public record RoomListResponse(
    SoloRoomSummaryResponse soloRoom, List<GroupRoomSummaryResponse> groupRooms) {}
