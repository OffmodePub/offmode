package com.offmode.boundedcontext.room.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class RenameRoomRequest {

  @NotBlank
  @Size(max = 30)
  private String name;
}
