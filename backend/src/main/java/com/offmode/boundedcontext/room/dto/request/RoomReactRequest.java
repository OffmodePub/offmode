package com.offmode.boundedcontext.room.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class RoomReactRequest {

  @NotBlank
  @Size(max = 10)
  private String emoji;
}
