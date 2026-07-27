package com.offmode.boundedcontext.room.dto.response;

import java.time.LocalDate;
import java.util.List;

public record MyHistoryResponse(LocalDate date, List<MyHistoryProofResponse> proofs) {}
