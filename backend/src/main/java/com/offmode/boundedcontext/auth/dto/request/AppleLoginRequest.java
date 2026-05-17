package com.offmode.boundedcontext.auth.dto.request;

import lombok.Getter;

@Getter
public class AppleLoginRequest {
  private String identityToken;
  private String fullName;
}
