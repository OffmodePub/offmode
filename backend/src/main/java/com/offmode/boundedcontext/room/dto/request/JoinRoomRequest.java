package com.offmode.boundedcontext.room.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class JoinRoomRequest {

  @NotBlank
  @Size(max = 20)
  private String inviteCode;
}
