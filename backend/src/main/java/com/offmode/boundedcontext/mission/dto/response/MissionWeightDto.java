package com.offmode.boundedcontext.mission.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MissionWeightDto {
  private Long id;
  private String icon;
  private String text;
  private String category;
  private double weight; // 0.0 ~ 1.0  (낮을수록 뽑힐 확률 낮음)
}
