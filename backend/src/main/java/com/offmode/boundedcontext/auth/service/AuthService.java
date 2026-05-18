package com.offmode.boundedcontext.auth.service;

import com.offmode.boundedcontext.auth.dto.response.AuthResponse;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.repository.UserRepository;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.jwt.JwtProvider;
import com.offmode.global.status.ErrorStatus;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.LocatorAdapter;
import io.jsonwebtoken.ProtectedHeader;
import java.math.BigInteger;
import java.security.Key;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

  private final UserRepository userRepository;
  private final JwtProvider jwtProvider;
  private final WebClient.Builder webClientBuilder;

  @Value("${kakao.user-info-url}")
  private String kakaoUserInfoUrl;

  @Value("${kakao.request-timeout-seconds:5}")
  private long kakaoRequestTimeoutSeconds;

  @Value("${apple.bundle-id}")
  private String appleBundleId;

  @Value("${apple.keys-url}")
  private String appleKeysUrl;

  @Value("${apple.issuer:https://appleid.apple.com}")
  private String appleIssuer;

  @Value("${apple.request-timeout-seconds:5}")
  private long appleRequestTimeoutSeconds;

  // ── Kakao ──────────────────────────────────────────────
  public AuthResponse kakaoLogin(String accessToken) {
    // 카카오 API로 사용자 정보 조회
    log.info("Kakao login requested");
    Map<?, ?> kakaoUser;
    try {
      log.debug("Requesting Kakao user info");
      kakaoUser =
          webClientBuilder
              .build()
              .get()
              .uri(kakaoUserInfoUrl)
              .header("Authorization", "Bearer " + accessToken)
              .retrieve()
              .bodyToMono(Map.class)
              .timeout(Duration.ofSeconds(kakaoRequestTimeoutSeconds))
              .block();
    } catch (Exception e) {
      // Kakao API 오류(만료된 토큰 등)를 그대로 전파하지 않도록 래핑
      log.warn("Kakao user info request failed", e);
      throw new BusinessException(ErrorStatus.AUTH_OAUTH_FAILED, e);
    }

    if (kakaoUser == null) throw new BusinessException(ErrorStatus.AUTH_OAUTH_FAILED);

    String providerId = String.valueOf(kakaoUser.get("id"));
    Map<?, ?> account = (Map<?, ?>) kakaoUser.get("kakao_account");
    String email = account != null ? (String) account.get("email") : null;
    Map<?, ?> profile = account != null ? (Map<?, ?>) account.get("profile") : null;
    String name = profile != null ? (String) profile.get("nickname") : null;

    AuthResponse response = buildResponse("kakao", providerId, email, name);
    log.info(
        "Kakao login succeeded, userId={}, isNew={}", response.getUser().getId(), response.isNew());
    return response;
  }

  // ── Apple ──────────────────────────────────────────────
  public AuthResponse appleLogin(String identityToken, String fullName) {
    if (identityToken == null || identityToken.isBlank()) {
      throw new BusinessException(ErrorStatus.AUTH_APPLE_INVALID_TOKEN);
    }

    List<Map<String, Object>> applePublicKeys = fetchApplePublicKeys();

    Claims claims;
    try {
      claims =
          Jwts.parser()
              .keyLocator(new ApplePublicKeyLocator(applePublicKeys))
              .requireIssuer(appleIssuer)
              .requireAudience(appleBundleId)
              .build()
              .parseSignedClaims(identityToken)
              .getPayload();
    } catch (JwtException | IllegalArgumentException e) {
      log.warn("Apple identity token validation failed: {}", e.getMessage());
      throw new BusinessException(ErrorStatus.AUTH_APPLE_INVALID_TOKEN, e);
    }

    String providerId = claims.getSubject();
    if (providerId == null || providerId.isBlank()) {
      log.warn("Apple identity token missing sub claim");
      throw new BusinessException(ErrorStatus.AUTH_APPLE_INVALID_TOKEN);
    }
    String email = claims.get("email", String.class);

    AuthResponse response = buildResponse("apple", providerId, email, fullName);
    log.info(
        "Apple login succeeded, userId={}, isNew={}", response.getUser().getId(), response.isNew());
    return response;
  }

  @SuppressWarnings("unchecked")
  private List<Map<String, Object>> fetchApplePublicKeys() {
    Map<?, ?> response;
    try {
      response =
          webClientBuilder
              .build()
              .get()
              .uri(appleKeysUrl)
              .retrieve()
              .bodyToMono(Map.class)
              .timeout(Duration.ofSeconds(appleRequestTimeoutSeconds))
              .block();
    } catch (Exception e) {
      log.warn("Apple public keys fetch failed", e);
      throw new BusinessException(ErrorStatus.AUTH_APPLE_KEY_UNAVAILABLE, e);
    }
    if (response == null || !(response.get("keys") instanceof List<?> keys) || keys.isEmpty()) {
      log.warn("Apple public keys response was empty or malformed");
      throw new BusinessException(ErrorStatus.AUTH_APPLE_KEY_UNAVAILABLE);
    }
    return keys.stream().filter(Map.class::isInstance).map(k -> (Map<String, Object>) k).toList();
  }

  // kid 기반으로 Apple 공개키를 선택. JJWT가 서명 검증·exp 만료 검증을 담당한다.
  private static class ApplePublicKeyLocator extends LocatorAdapter<Key> {
    private final List<Map<String, Object>> keys;

    ApplePublicKeyLocator(List<Map<String, Object>> keys) {
      this.keys = keys;
    }

    @Override
    protected Key locate(ProtectedHeader header) {
      String kid = header.getKeyId();
      if (kid == null || kid.isBlank()) return null;
      return keys.stream()
          .filter(k -> kid.equals(k.get("kid")))
          .findFirst()
          .map(ApplePublicKeyLocator::toPublicKey)
          .orElse(null);
    }

    private static PublicKey toPublicKey(Map<String, Object> key) {
      try {
        byte[] nBytes = Base64.getUrlDecoder().decode((String) key.get("n"));
        byte[] eBytes = Base64.getUrlDecoder().decode((String) key.get("e"));
        return KeyFactory.getInstance("RSA")
            .generatePublic(
                new RSAPublicKeySpec(new BigInteger(1, nBytes), new BigInteger(1, eBytes)));
      } catch (Exception e) {
        return null;
      }
    }
  }

  // ── 공통: 유저 찾기/생성 후 JWT 발급 ──────────────────
  private AuthResponse buildResponse(
      String provider, String providerId, String email, String name) {
    boolean[] isNew = {false};
    User user =
        userRepository
            .findByProviderAndProviderId(provider, providerId)
            .orElseGet(
                () -> {
                  isNew[0] = true;
                  return userRepository.save(
                      User.builder()
                          .provider(provider)
                          .providerId(providerId)
                          .email(email)
                          .name(name != null ? name : "오프모더")
                          .build());
                });

    String token = jwtProvider.generate(user.getId());
    return new AuthResponse(token, user, isNew[0]);
  }
}
