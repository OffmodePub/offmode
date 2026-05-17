package com.offmode.boundedcontext.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserStatsDto {
  private long totalMissions; // 전체 미션 수 (pending + verified)
  private long totalVerified; // 인증 완료 미션 수
  private int streak; // 현재 연속 달성 일수

  private int energyFill; // Energy 진행도 (0-100)
  private int energyLevel; // Energy 레벨
  private int intellectFill; // Intellect 진행도
  private int intellectLevel; // Intellect 레벨
  private int vitalityFill; // Vitality 진행도
  private int vitalityLevel; // Vitality 레벨
}
