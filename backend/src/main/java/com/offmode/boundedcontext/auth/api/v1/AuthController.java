package com.offmode.boundedcontext.auth.in.api.v1;

import com.offmode.boundedcontext.auth.app.dto.request.AppleLoginRequest;
import com.offmode.boundedcontext.auth.app.dto.request.KakaoLoginRequest;
import com.offmode.boundedcontext.auth.app.dto.response.AuthResponse;
import com.offmode.boundedcontext.auth.app.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

  // POST /api/auth/kakao
  // body: { "accessToken": "..." }
  @PostMapping("/kakao")
  public ResponseEntity<AuthResponse> kakao(@RequestBody KakaoLoginRequest req) {
    return ResponseEntity.ok(authService.kakaoLogin(req.getAccessToken()));
  }

  // POST /api/auth/apple
  // body: { "identityToken": "...", "fullName": "..." }
  @PostMapping("/apple")
  public ResponseEntity<AuthResponse> apple(@RequestBody AppleLoginRequest req) {
    return ResponseEntity.ok(authService.appleLogin(req.getIdentityToken(), req.getFullName()));
  }
}
