package com.offmode.boundedcontext.auth.api.v1;

import com.offmode.boundedcontext.auth.dto.request.AppleLoginRequest;
import com.offmode.boundedcontext.auth.dto.request.KakaoLoginRequest;
import com.offmode.boundedcontext.auth.dto.response.AuthResponse;
import com.offmode.boundedcontext.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

  // POST /api/v1/auth/kakao
  // body: { "accessToken": "..." }
  @PostMapping("/kakao")
  public ResponseEntity<AuthResponse> kakao(@RequestBody KakaoLoginRequest req) {
    return ResponseEntity.ok(authService.kakaoLogin(req.getAccessToken()));
  }

  // POST /api/v1/auth/apple
  // body: { "identityToken": "...", "fullName": "..." }
  @PostMapping("/apple")
  public ResponseEntity<AuthResponse> apple(@RequestBody AppleLoginRequest req) {
    return ResponseEntity.ok(authService.appleLogin(req.getIdentityToken(), req.getFullName()));
  }
}
