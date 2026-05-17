package com.offmode.boundedcontext.feed.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class ReactRequest {

  @NotBlank
  @Size(max = 10)
  private String emoji;
}
