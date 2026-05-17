package com.offmode.boundedcontext.mission.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class SetTodayMissionRequest {

  @NotBlank
  @Size(max = 16)
  private String icon;

  @NotBlank
  @Size(max = 100)
  private String text;

  @NotBlank
  @Pattern(regexp = "Energy|Intellect|Vitality")
  private String category;
}
