package com.offmode.auth;

import com.offmode.auth.dto.AppleLoginRequest;
import com.offmode.auth.dto.AuthResponse;
import com.offmode.auth.dto.KakaoLoginRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
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
