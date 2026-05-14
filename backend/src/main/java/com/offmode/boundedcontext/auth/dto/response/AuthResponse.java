package com.offmode.boundedcontext.auth.app.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.offmode.boundedcontext.user.domain.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthResponse {
  private String token;
  private User user;

  @JsonProperty("isNew")
  private boolean isNew; // true → 회원가입 화면으로 이동
}
