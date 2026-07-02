package com.offmode.boundedcontext.room.dto.response;

import com.offmode.boundedcontext.room.types.ProofStatus;
import java.time.LocalDateTime;
import java.util.List;

public record RoomProofResponse(
    Long id,
    String authorNickname,
    String authorAvatarId,
    String photoUrl,
    String caption,
    LocalDateTime createdAt,
    ProofStatus status,
    int confirmCount,
    int requiredConfirm,
    boolean myConfirmed,
    boolean mine,
    List<RoomReactionSummaryResponse> reactions) {}
