package com.offmode.boundedcontext.part.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Getter;

/** 캐릭터에 배치할 파츠 1개. x/y 는 0~1 정규화 좌표. */
@Getter
public class PlacementRequest {

  @NotBlank private String key;

  @DecimalMin("0.0")
  @DecimalMax("1.0")
  private double x;

  @DecimalMin("0.0")
  @DecimalMax("1.0")
  private double y;

  @Positive private double scale;

  private double rotation;

  private int z;
}
