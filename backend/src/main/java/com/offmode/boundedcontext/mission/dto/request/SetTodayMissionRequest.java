package com.offmode.boundedcontext.mission.dto.request;

import com.offmode.boundedcontext.mission.types.MissionCategory;
import jakarta.validation.constraints.NotBlank;
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

  @NotBlank @ValidMissionCategory private String category;

  public MissionCategory getMissionCategory() {
    return MissionCategory.from(category);
  }
}
