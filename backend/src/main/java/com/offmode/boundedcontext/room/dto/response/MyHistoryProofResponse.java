package com.offmode.boundedcontext.room.dto.response;

import com.offmode.boundedcontext.room.types.ProofStatus;
import com.offmode.boundedcontext.room.types.RoomIconKey;

public record MyHistoryProofResponse(
    String time,
    String roomName,
    RoomIconKey roomIconKey,
    MiniMissionResponse mission,
    String photoUrl,
    ProofStatus status) {}
