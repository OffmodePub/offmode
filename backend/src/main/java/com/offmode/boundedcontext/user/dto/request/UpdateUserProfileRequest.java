package com.offmode.boundedcontext.user.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class UpdateUserProfileRequest {

  @Size(max = 30)
  private String name;

  @Size(max = 500)
  private String avatar;

  @Min(0)
  @Max(23)
  private Integer missionHour;

  @Min(0)
  @Max(59)
  private Integer missionMinute;

  private Boolean autoRoulette;
}
