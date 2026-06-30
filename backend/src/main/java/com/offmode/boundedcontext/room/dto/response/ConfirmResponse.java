package com.offmode.boundedcontext.room.dto.response;

import com.offmode.boundedcontext.room.types.ProofStatus;

public record ConfirmResponse(int confirmCount, int requiredConfirm, ProofStatus status) {}
