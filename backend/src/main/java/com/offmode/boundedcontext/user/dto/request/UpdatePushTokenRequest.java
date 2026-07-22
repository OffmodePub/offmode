package com.offmode.boundedcontext.user.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class UpdatePushTokenRequest {

  /** Expo 푸시 토큰. null/빈 값이면 해제(로그아웃 등)로 처리한다. */
  @Size(max = 255)
  private String token;
}
