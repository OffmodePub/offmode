package com.offmode.boundedcontext.room.dto.response;

import java.time.LocalDate;
import java.util.List;

public record RoomHistoryResponse(
    LocalDate date,
    int confirmedCount,
    MiniMissionResponse mission,
    List<HistoryProofResponse> proofs) {}
