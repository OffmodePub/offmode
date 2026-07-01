package com.offmode.boundedcontext.room.dto.request;

import com.offmode.boundedcontext.room.types.ProofReportReason;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReportRequest(@NotNull ProofReportReason reason, @Size(max = 500) String detail) {}
