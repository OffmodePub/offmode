package com.offmode.auth.dto;

import lombok.Getter;

@Getter
public class AppleLoginRequest {
  private String identityToken;
  private String fullName;
}
