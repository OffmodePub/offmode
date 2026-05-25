package com.offmode.boundedcontext.mission.dto.response;

import com.offmode.boundedcontext.mission.types.MissionCategory;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MissionWeightResponse {
  private Long id;
  private String icon;
  private String text;
  private String category;
  private double weight; // 0.0 ~ 1.0  (낮을수록 뽑힐 확률 낮음)

  public MissionWeightResponse(
      Long id, String icon, String text, MissionCategory category, double weight) {
    this(id, icon, text, category.value(), weight);
  }
}
