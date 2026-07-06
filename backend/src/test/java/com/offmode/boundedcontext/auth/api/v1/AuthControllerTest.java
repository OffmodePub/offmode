package com.offmode.boundedcontext.auth.api.v1;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.offmode.boundedcontext.auth.dto.response.AuthResponse;
import com.offmode.boundedcontext.auth.service.AuthService;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.global.config.SecurityConfig;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.jwt.JwtAuthFilter;
import com.offmode.global.jwt.JwtProvider;
import com.offmode.global.status.ErrorStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = AuthController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class})
class AuthControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private AuthService authService;
  @MockitoBean private JwtProvider jwtProvider;

  private User user(String name) {
    return User.builder().id(1L).provider("kakao").providerId("p1").name(name).build();
  }

  @Test
  void kakaoLoginReturnsAuthResponseWithoutAuthentication() throws Exception {
    when(authService.kakaoLogin("kakao-access-token"))
        .thenReturn(new AuthResponse("jwt-token", user("오프모더"), true));

    mockMvc
        .perform(
            post("/api/v1/auth/kakao")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"accessToken\":\"kakao-access-token\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").value("jwt-token"))
        .andExpect(jsonPath("$.isNew").value(true))
        .andExpect(jsonPath("$.user.name").value("오프모더"));
  }

  @Test
  void appleLoginReturnsAuthResponse() throws Exception {
    when(authService.appleLogin("identity-token", "홍길동"))
        .thenReturn(new AuthResponse("jwt-token", user("홍길동"), false));

    mockMvc
        .perform(
            post("/api/v1/auth/apple")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"identityToken\":\"identity-token\",\"fullName\":\"홍길동\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").value("jwt-token"))
        .andExpect(jsonPath("$.isNew").value(false))
        .andExpect(jsonPath("$.user.name").value("홍길동"));
  }

  @Test
  void kakaoLoginFailureReturnsUnauthorizedApiResponse() throws Exception {
    when(authService.kakaoLogin("bad-token"))
        .thenThrow(new BusinessException(ErrorStatus.AUTH_OAUTH_FAILED));

    mockMvc
        .perform(
            post("/api/v1/auth/kakao")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"accessToken\":\"bad-token\"}"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.isSuccess").value(false))
        .andExpect(jsonPath("$.code").value("AUTH_401_001"))
        .andExpect(jsonPath("$.message").value("OAuth 인증에 실패했습니다."));
  }

  @Test
  void appleLoginWithInvalidTokenReturnsUnauthorizedApiResponse() throws Exception {
    when(authService.appleLogin("expired-token", null))
        .thenThrow(new BusinessException(ErrorStatus.AUTH_APPLE_INVALID_TOKEN));

    mockMvc
        .perform(
            post("/api/v1/auth/apple")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"identityToken\":\"expired-token\"}"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.isSuccess").value(false))
        .andExpect(jsonPath("$.code").value("AUTH_401_002"))
        .andExpect(jsonPath("$.message").value("Apple 인증 토큰이 유효하지 않습니다."));
  }

  @Test
  void malformedJsonReturnsBadRequestApiResponse() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/auth/kakao")
                .contentType(MediaType.APPLICATION_JSON)
                .content("not-a-json"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.isSuccess").value(false))
        .andExpect(jsonPath("$.code").value("COMMON_400"))
        .andExpect(jsonPath("$.message").value("잘못된 요청입니다."));
  }
}
