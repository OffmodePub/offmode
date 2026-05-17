package com.offmode.boundedcontext.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.offmode.boundedcontext.auth.dto.response.AuthResponse;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.repository.UserRepository;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.jwt.JwtProvider;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

  @Mock private UserRepository userRepository;
  @Mock private JwtProvider jwtProvider;

  private AuthService authService;

  @BeforeEach
  void setUp() {
    authService = new AuthService(userRepository, jwtProvider, kakaoSuccessBuilder());
    ReflectionTestUtils.setField(authService, "kakaoUserInfoUrl", "https://kakao.test/me");
    ReflectionTestUtils.setField(authService, "kakaoRequestTimeoutSeconds", 5L);
    ReflectionTestUtils.setField(authService, "appleBundleId", "com.minnnj.offmode");
    ReflectionTestUtils.setField(authService, "appleKeysUrl", "https://apple.test/keys");
  }

  @Test
  void kakaoLoginCreatesUserAndReturnsJwt() {
    User saved =
        User.builder()
            .id(1L)
            .provider("kakao")
            .providerId("123")
            .email("kakao@example.com")
            .name("카카오")
            .build();
    when(userRepository.findByProviderAndProviderId("kakao", "123")).thenReturn(Optional.empty());
    when(userRepository.save(any(User.class))).thenReturn(saved);
    when(jwtProvider.generate(1L)).thenReturn("jwt-token");

    AuthResponse response = authService.kakaoLogin("access-token");

    assertThat(response.getToken()).isEqualTo("jwt-token");
    assertThat(response.getUser()).isSameAs(saved);
    assertThat(response.isNew()).isTrue();
  }

  @Test
  void kakaoLoginWrapsKakaoApiFailure() {
    authService = new AuthService(userRepository, jwtProvider, kakaoFailureBuilder());
    ReflectionTestUtils.setField(authService, "kakaoUserInfoUrl", "https://kakao.test/me");
    ReflectionTestUtils.setField(authService, "kakaoRequestTimeoutSeconds", 5L);

    assertThatThrownBy(() -> authService.kakaoLogin("bad-token"))
        .isInstanceOf(BusinessException.class)
        .hasMessage("OAuth 인증에 실패했습니다.");
    verify(userRepository, never()).save(any());
  }

  @Test
  void appleLoginRejectsMalformedIdentityToken() {
    assertThatThrownBy(() -> authService.appleLogin("malformed-token", "Apple User"))
        .isInstanceOf(BusinessException.class)
        .hasMessage("OAuth 인증에 실패했습니다.");
  }

  private WebClient.Builder kakaoSuccessBuilder() {
    return WebClient.builder()
        .exchangeFunction(
            request -> {
              String body =
                  """
                  {
                    "id": 123,
                    "kakao_account": {
                      "email": "kakao@example.com",
                      "profile": { "nickname": "카카오" }
                    }
                  }
                  """;
              return Mono.just(
                  ClientResponse.create(HttpStatus.OK)
                      .header("Content-Type", "application/json")
                      .body(body)
                      .build());
            });
  }

  private WebClient.Builder kakaoFailureBuilder() {
    return WebClient.builder()
        .exchangeFunction(
            request ->
                Mono.just(
                    ClientResponse.create(HttpStatus.UNAUTHORIZED)
                        .header("Content-Type", "application/json")
                        .body("{}")
                        .build()));
  }
}
