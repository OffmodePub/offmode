package com.offmode.boundedcontext.auth.service;

import com.offmode.boundedcontext.auth.dto.response.AuthResponse;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.repository.UserRepository;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.jwt.JwtProvider;
import com.offmode.global.status.ErrorStatus;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import java.math.BigInteger;
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
    try {
      // Apple 공개키 목록 조회
      Map<?, ?> keysResponse =
          webClientBuilder.build().get().uri(appleKeysUrl).retrieve().bodyToMono(Map.class).block();

      List<?> keys = (List<?>) keysResponse.get("keys");

      // identityToken 헤더에서 kid 추출
      String[] parts = identityToken.split("\\.");
      String headerJson = new String(Base64.getUrlDecoder().decode(parts[0]));
      String kid = headerJson.replaceAll(".*\"kid\":\"([^\"]+)\".*", "$1");

      // kid 일치하는 Apple 공개키 찾기
      Map<?, ?> matchedKey =
          keys.stream()
              .filter(k -> kid.equals(((Map<?, ?>) k).get("kid")))
              .map(k -> (Map<?, ?>) k)
              .findFirst()
              .orElseThrow(() -> new BusinessException(ErrorStatus.AUTH_OAUTH_FAILED));

      // RSA 공개키 생성
      byte[] nBytes = Base64.getUrlDecoder().decode((String) matchedKey.get("n"));
      byte[] eBytes = Base64.getUrlDecoder().decode((String) matchedKey.get("e"));
      PublicKey publicKey =
          KeyFactory.getInstance("RSA")
              .generatePublic(
                  new RSAPublicKeySpec(new BigInteger(1, nBytes), new BigInteger(1, eBytes)));

      // JWT 검증
      Claims claims =
          Jwts.parser()
              .verifyWith((java.security.interfaces.RSAPublicKey) publicKey)
              .build()
              .parseSignedClaims(identityToken)
              .getPayload();

      if (!appleBundleId.equals(claims.getAudience().iterator().next())) {
        throw new BusinessException(ErrorStatus.AUTH_OAUTH_FAILED);
      }

      String providerId = claims.getSubject();
      String email = claims.get("email", String.class);

      return buildResponse("apple", providerId, email, fullName);
    } catch (BusinessException e) {
      throw e;
    } catch (Exception e) {
      throw new BusinessException(ErrorStatus.AUTH_OAUTH_FAILED, e);
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
