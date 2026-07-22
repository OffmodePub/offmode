package com.offmode.boundedcontext.room.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class UpdateRoomMissionTitleRequest {

  @NotBlank
  @Size(max = 100)
  private String title;
}
