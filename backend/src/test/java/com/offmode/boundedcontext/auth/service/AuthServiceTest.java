package com.offmode.boundedcontext.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.offmode.boundedcontext.auth.dto.response.AuthResponse;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.repository.UserRepository;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.jwt.JwtProvider;
import com.offmode.global.status.ErrorStatus;
import io.jsonwebtoken.Jwts;
import java.math.BigInteger;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeAll;
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

  private static final String APPLE_ISSUER = "https://appleid.apple.com";
  private static final String APPLE_AUDIENCE = "com.minnnj.offmode";
  private static final String APPLE_KID = "test-kid";

  private static KeyPair appleKeyPair;
  private static Map<String, Object> appleJwk;

  @Mock private UserRepository userRepository;
  @Mock private JwtProvider jwtProvider;

  private AuthService authService;

  @BeforeAll
  static void generateAppleKey() throws Exception {
    KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
    gen.initialize(2048);
    appleKeyPair = gen.generateKeyPair();
    appleJwk = jwkFor((RSAPublicKey) appleKeyPair.getPublic(), APPLE_KID);
  }

  @BeforeEach
  void setUp() {
    authService = new AuthService(userRepository, jwtProvider, kakaoSuccessBuilder());
    ReflectionTestUtils.setField(authService, "kakaoUserInfoUrl", "https://kakao.test/me");
    ReflectionTestUtils.setField(authService, "kakaoRequestTimeoutSeconds", 5L);
    ReflectionTestUtils.setField(authService, "appleBundleId", APPLE_AUDIENCE);
    ReflectionTestUtils.setField(authService, "appleKeysUrl", "https://apple.test/keys");
    ReflectionTestUtils.setField(authService, "appleIssuer", APPLE_ISSUER);
    ReflectionTestUtils.setField(authService, "appleRequestTimeoutSeconds", 5L);
  }

  // ── Kakao ──────────────────────────────────────────────

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

  // ── Apple ──────────────────────────────────────────────

  @Test
  void appleLoginSucceedsWithValidToken() {
    setAppleKeysBuilder(appleJwk);
    String token = appleTokenBuilder().compact();

    User saved =
        User.builder()
            .id(7L)
            .provider("apple")
            .providerId("apple-user-1")
            .email("apple@example.com")
            .name("Apple User")
            .build();
    when(userRepository.findByProviderAndProviderId("apple", "apple-user-1"))
        .thenReturn(Optional.empty());
    when(userRepository.save(any(User.class))).thenReturn(saved);
    when(jwtProvider.generate(7L)).thenReturn("apple-jwt");

    AuthResponse response = authService.appleLogin(token, "Apple User");

    assertThat(response.getToken()).isEqualTo("apple-jwt");
    assertThat(response.getUser()).isSameAs(saved);
    assertThat(response.isNew()).isTrue();
  }

  @Test
  void appleLoginRejectsMalformedIdentityToken() {
    setAppleKeysBuilder(appleJwk);

    assertThatThrownBy(() -> authService.appleLogin("not-a-jwt", "Apple User"))
        .isInstanceOf(BusinessException.class)
        .extracting("errorStatus")
        .isEqualTo(ErrorStatus.AUTH_APPLE_INVALID_TOKEN);
  }

  @Test
  void appleLoginRejectsBlankToken() {
    assertThatThrownBy(() -> authService.appleLogin("   ", "Apple User"))
        .isInstanceOf(BusinessException.class)
        .extracting("errorStatus")
        .isEqualTo(ErrorStatus.AUTH_APPLE_INVALID_TOKEN);
  }

  @Test
  void appleLoginRejectsExpiredToken() {
    setAppleKeysBuilder(appleJwk);
    String expired =
        appleTokenBuilder()
            .issuedAt(Date.from(Instant.now().minus(Duration.ofHours(2))))
            .expiration(Date.from(Instant.now().minus(Duration.ofHours(1))))
            .compact();

    assertThatThrownBy(() -> authService.appleLogin(expired, "Apple User"))
        .isInstanceOf(BusinessException.class)
        .extracting("errorStatus")
        .isEqualTo(ErrorStatus.AUTH_APPLE_INVALID_TOKEN);
  }

  @Test
  void appleLoginRejectsWrongIssuer() {
    setAppleKeysBuilder(appleJwk);
    String wrongIssuer = appleTokenBuilder().issuer("https://evil.example.com").compact();

    assertThatThrownBy(() -> authService.appleLogin(wrongIssuer, "Apple User"))
        .isInstanceOf(BusinessException.class)
        .extracting("errorStatus")
        .isEqualTo(ErrorStatus.AUTH_APPLE_INVALID_TOKEN);
  }

  @Test
  void appleLoginRejectsWrongAudience() {
    setAppleKeysBuilder(appleJwk);
    String wrongAud =
        appleTokenBuilder().audience().clear().add("com.someoneelse.app").and().compact();

    assertThatThrownBy(() -> authService.appleLogin(wrongAud, "Apple User"))
        .isInstanceOf(BusinessException.class)
        .extracting("errorStatus")
        .isEqualTo(ErrorStatus.AUTH_APPLE_INVALID_TOKEN);
  }

  @Test
  void appleLoginRejectsUnknownKid() {
    setAppleKeysBuilder(jwkFor((RSAPublicKey) appleKeyPair.getPublic(), "other-kid"));
    String token = appleTokenBuilder().compact();

    assertThatThrownBy(() -> authService.appleLogin(token, "Apple User"))
        .isInstanceOf(BusinessException.class)
        .extracting("errorStatus")
        .isEqualTo(ErrorStatus.AUTH_APPLE_INVALID_TOKEN);
  }

  @Test
  void appleLoginRejectsBlankSub() {
    setAppleKeysBuilder(appleJwk);
    String noSub = appleTokenBuilder().subject(null).compact();

    assertThatThrownBy(() -> authService.appleLogin(noSub, "Apple User"))
        .isInstanceOf(BusinessException.class)
        .extracting("errorStatus")
        .isEqualTo(ErrorStatus.AUTH_APPLE_INVALID_TOKEN);
  }

  @Test
  void appleLoginWrapsAppleKeysFetchFailure() {
    authService = new AuthService(userRepository, jwtProvider, appleKeysErrorBuilder());
    applyAppleConfig();
    String token = appleTokenBuilder().compact();

    assertThatThrownBy(() -> authService.appleLogin(token, "Apple User"))
        .isInstanceOf(BusinessException.class)
        .extracting("errorStatus")
        .isEqualTo(ErrorStatus.AUTH_APPLE_KEY_UNAVAILABLE);
  }

  @Test
  void appleLoginRejectsEmptyKeysResponse() {
    setAppleKeysBuilderWithBody("{ \"keys\": [] }");
    String token = appleTokenBuilder().compact();

    assertThatThrownBy(() -> authService.appleLogin(token, "Apple User"))
        .isInstanceOf(BusinessException.class)
        .extracting("errorStatus")
        .isEqualTo(ErrorStatus.AUTH_APPLE_KEY_UNAVAILABLE);
  }

  // ── helpers ────────────────────────────────────────────

  private io.jsonwebtoken.JwtBuilder appleTokenBuilder() {
    PrivateKey privateKey = appleKeyPair.getPrivate();
    return Jwts.builder()
        .header()
        .keyId(APPLE_KID)
        .and()
        .issuer(APPLE_ISSUER)
        .audience()
        .add(APPLE_AUDIENCE)
        .and()
        .subject("apple-user-1")
        .issuedAt(Date.from(Instant.now()))
        .expiration(Date.from(Instant.now().plus(Duration.ofMinutes(10))))
        .claim("email", "apple@example.com")
        .signWith(privateKey, Jwts.SIG.RS256);
  }

  private void setAppleKeysBuilder(Map<String, Object> jwk) {
    String body;
    try {
      body = new ObjectMapper().writeValueAsString(Map.of("keys", List.of(jwk)));
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
    setAppleKeysBuilderWithBody(body);
  }

  private void setAppleKeysBuilderWithBody(String body) {
    authService =
        new AuthService(
            userRepository,
            jwtProvider,
            WebClient.builder()
                .exchangeFunction(
                    request ->
                        Mono.just(
                            ClientResponse.create(HttpStatus.OK)
                                .header("Content-Type", "application/json")
                                .body(body)
                                .build())));
    applyAppleConfig();
  }

  private void applyAppleConfig() {
    ReflectionTestUtils.setField(authService, "kakaoUserInfoUrl", "https://kakao.test/me");
    ReflectionTestUtils.setField(authService, "kakaoRequestTimeoutSeconds", 5L);
    ReflectionTestUtils.setField(authService, "appleBundleId", APPLE_AUDIENCE);
    ReflectionTestUtils.setField(authService, "appleKeysUrl", "https://apple.test/keys");
    ReflectionTestUtils.setField(authService, "appleIssuer", APPLE_ISSUER);
    ReflectionTestUtils.setField(authService, "appleRequestTimeoutSeconds", 5L);
  }

  private static Map<String, Object> jwkFor(RSAPublicKey pub, String kid) {
    Map<String, Object> jwk = new LinkedHashMap<>();
    jwk.put("kty", "RSA");
    jwk.put("alg", "RS256");
    jwk.put("use", "sig");
    jwk.put("kid", kid);
    jwk.put("n", b64Url(pub.getModulus()));
    jwk.put("e", b64Url(pub.getPublicExponent()));
    return jwk;
  }

  private static String b64Url(BigInteger value) {
    byte[] bytes = value.toByteArray();
    if (bytes.length > 1 && bytes[0] == 0) {
      byte[] tmp = new byte[bytes.length - 1];
      System.arraycopy(bytes, 1, tmp, 0, tmp.length);
      bytes = tmp;
    }
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
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

  private WebClient.Builder appleKeysErrorBuilder() {
    return WebClient.builder()
        .exchangeFunction(
            request -> Mono.just(ClientResponse.create(HttpStatus.INTERNAL_SERVER_ERROR).build()));
  }
}
