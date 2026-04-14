package com.offmode.auth;

import com.offmode.auth.dto.AuthResponse;
import com.offmode.jwt.JwtProvider;
import com.offmode.mission.UserMissionRepository;
import com.offmode.user.User;
import com.offmode.user.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository        userRepository;
    private final UserMissionRepository userMissionRepository;
    private final JwtProvider           jwtProvider;
    private final WebClient.Builder     webClientBuilder;

    @Value("${kakao.user-info-url}")
    private String kakaoUserInfoUrl;

    @Value("${apple.bundle-id}")
    private String appleBundleId;

    @Value("${apple.keys-url}")
    private String appleKeysUrl;

    // ── Kakao ──────────────────────────────────────────────
    public AuthResponse kakaoLogin(String accessToken) {
        // 카카오 API로 사용자 정보 조회
        Map<?, ?> kakaoUser;
        try {
            kakaoUser = webClientBuilder.build()
                    .get()
                    .uri(kakaoUserInfoUrl)
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (Exception e) {
            // Kakao API 오류(만료된 토큰 등)를 그대로 전파하지 않도록 래핑
            throw new RuntimeException("카카오 토큰 검증 실패: " + e.getMessage());
        }

        if (kakaoUser == null) throw new RuntimeException("카카오 토큰 검증 실패");

        String providerId = String.valueOf(kakaoUser.get("id"));
        Map<?, ?> account  = (Map<?, ?>) kakaoUser.get("kakao_account");
        String email       = account != null ? (String) account.get("email") : null;
        Map<?, ?> profile  = account != null ? (Map<?, ?>) account.get("profile") : null;
        String name        = profile != null ? (String) profile.get("nickname") : null;

        return buildResponse("kakao", providerId, email, name);
    }

    // ── Apple ──────────────────────────────────────────────
    public AuthResponse appleLogin(String identityToken, String fullName) {
        try {
            // Apple 공개키 목록 조회
            Map<?, ?> keysResponse = webClientBuilder.build()
                    .get()
                    .uri(appleKeysUrl)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            List<?> keys = (List<?>) keysResponse.get("keys");

            // identityToken 헤더에서 kid 추출
            String[] parts    = identityToken.split("\\.");
            String  headerJson = new String(Base64.getUrlDecoder().decode(parts[0]));
            String  kid        = headerJson.replaceAll(".*\"kid\":\"([^\"]+)\".*", "$1");

            // kid 일치하는 Apple 공개키 찾기
            Map<?, ?> matchedKey = keys.stream()
                    .filter(k -> kid.equals(((Map<?, ?>) k).get("kid")))
                    .map(k -> (Map<?, ?>) k)
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Apple 공개키 없음"));

            // RSA 공개키 생성
            byte[]    nBytes = Base64.getUrlDecoder().decode((String) matchedKey.get("n"));
            byte[]    eBytes = Base64.getUrlDecoder().decode((String) matchedKey.get("e"));
            PublicKey publicKey = KeyFactory.getInstance("RSA")
                    .generatePublic(new RSAPublicKeySpec(
                            new BigInteger(1, nBytes),
                            new BigInteger(1, eBytes)));

            // JWT 검증
            Claims claims = Jwts.parser()
                    .verifyWith((java.security.interfaces.RSAPublicKey) publicKey)
                    .build()
                    .parseSignedClaims(identityToken)
                    .getPayload();

            if (!appleBundleId.equals(claims.getAudience().iterator().next())) {
                throw new RuntimeException("Bundle ID 불일치");
            }

            String providerId = claims.getSubject();
            String email      = claims.get("email", String.class);

            return buildResponse("apple", providerId, email, fullName);
        } catch (Exception e) {
            throw new RuntimeException("Apple 로그인 실패: " + e.getMessage(), e);
        }
    }

    // ── 공통: 유저 찾기/생성 후 JWT 발급 ──────────────────
    private AuthResponse buildResponse(String provider, String providerId, String email, String name) {
        boolean[] isNew = {false};
        User user = userRepository.findByProviderAndProviderId(provider, providerId)
                .orElseGet(() -> {
                    isNew[0] = true;
                    return userRepository.save(User.builder()
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
