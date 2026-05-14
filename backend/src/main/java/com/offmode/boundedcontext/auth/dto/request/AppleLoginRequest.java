package com.offmode.boundedcontext.auth.app.dto.request;

import lombok.Getter;

@Getter
public class AppleLoginRequest {
  private String identityToken;
  private String fullName;
}
