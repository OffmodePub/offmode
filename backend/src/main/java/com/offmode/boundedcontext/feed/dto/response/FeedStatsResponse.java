package com.offmode.boundedcontext.feed.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FeedStatsResponse {
  private long activeToday; // 오늘 미션을 수락한 유저 수
  private int verificationRate; // 전체 인증 완료율 (%)
  private int streakDays; // 현재 유저의 연속 달성 일수
}
