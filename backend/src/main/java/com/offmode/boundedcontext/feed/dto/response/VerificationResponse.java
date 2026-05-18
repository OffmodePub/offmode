package com.offmode.boundedcontext.feed.dto.response;

import com.offmode.boundedcontext.feed.entity.Verification;
import java.time.LocalDateTime;

public record VerificationResponse(
    Long id, String photoUrl, String caption, LocalDateTime createdAt) {

  public static VerificationResponse from(Verification verification) {
    return new VerificationResponse(
        verification.getId(),
        verification.getPhotoUrl(),
        verification.getCaption(),
        verification.getCreatedAt());
  }
}
