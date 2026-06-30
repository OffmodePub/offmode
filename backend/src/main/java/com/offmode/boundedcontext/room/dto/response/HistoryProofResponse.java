package com.offmode.boundedcontext.room.dto.response;

import com.offmode.boundedcontext.room.types.ProofStatus;

public record HistoryProofResponse(
    String time,
    String authorNickname,
    String authorAvatarId,
    String photoUrl,
    ProofStatus status) {}
