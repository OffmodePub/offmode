package com.offmode.boundedcontext.room.types;

/** 멤버의 오늘 인증 상태 (응답 전용, 영속화하지 않고 계산해서 내려준다). */
public enum MemberTodayStatus {
  DONE,
  PENDING,
  NONE
}
