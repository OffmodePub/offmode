# OAuth 외부 콘솔 설정 체크리스트

iOS 심사 제출 전 Kakao Developers / Apple Developer 콘솔 설정이 repo 값과 일치하는지 검증하기 위한 체크리스트.
**콘솔 값 ≠ 코드 값 → 실기기 로그인 실패 → 심사 자동 리젝.** 제출 직전 반드시 한 번 훑는다.

## 1. repo 측 기준값 (Source of Truth)

대조의 기준이 되는 값들. 변경되면 이 문서도 함께 갱신한다.

| 항목 | 값 | 출처 |
|---|---|---|
| iOS Bundle ID | `com.minnnj.offmode` | `app.json:15` (Info.plist의 `CFBundleIdentifier`는 `$(PRODUCT_BUNDLE_IDENTIFIER)` 빌드 변수로 주입됨) |
| Android package | `com.minnnj.offmode` | `app.json:28` |
| Apple Team ID | `SX5KZM28U5` | `app.json:16` |
| Apple Sign In capability | enabled | `app.json:17` (`usesAppleSignIn: true`), `app.json:46` (`expo-apple-authentication`) |
| Kakao Native App Key | `62ae912ced27c2b48181b0a6d1c84353` | `app.json:50`, `ios/offmode/Info.plist:45` (`KAKAO_APP_KEY`) |
| iOS Kakao URL scheme | `kakao62ae912ced27c2b48181b0a6d1c84353` | `ios/offmode/Info.plist:38` |
| Android Kakao redirect | scheme `kakao62ae912ced27c2b48181b0a6d1c84353`, host `oauth` | `android/app/src/main/AndroidManifest.xml:41` |
| 백엔드 Apple audience | `com.minnnj.offmode` | `backend/src/main/resources/application.yml:23` (`apple.bundle-id`) |
| 백엔드 Apple issuer | `https://appleid.apple.com` | `backend/src/main/resources/application.yml:25` |
| 백엔드 Kakao userinfo | `https://kapi.kakao.com/v2/user/me` | `backend/src/main/resources/application.yml:19` |

> 백엔드는 Apple identityToken을 직접 검증한다 (`AuthService.appleLogin`, JJWT + `keys-url`로 공개키 조회).
> Apple Service ID / Key ID / P8 키는 server-to-server flow를 쓰지 않으므로 **불필요**하다.

---

## 2. Kakao Developers 콘솔 체크리스트

콘솔: https://developers.kakao.com → 내 애플리케이션 → offmode

### 2-1. 앱 기본 정보
- [ ] **앱 키 > 네이티브 앱 키**가 `62ae912ced27c2b48181b0a6d1c84353` 와 동일
- [ ] 일반 앱 vs 비즈 앱 — **현재 백엔드 구조에서는 일반 앱 상태로 OK**
  - 카카오는 iOS처럼 "테스트/운영" 단일 토글이 없음
  - **일반 앱**: `profile_nickname` 등 검수 불필요한 기본 동의항목만 사용 가능 → 누구나 로그인 가능
  - **비즈 앱** (사업자/개인 본인인증 필요): `account_email` 등 검수 필요 항목 추가 가능
  - offmode 백엔드는 nickname만 필수, email은 null 허용 → **비즈 앱 전환 불필요**
  - 위치: **[앱 설정]** > **[비즈니스]** 에서 "이 앱은 비즈 앱이 아닙니다" 안내가 보이는 게 정상
  - ⚠️ 만약 백엔드가 향후 email을 필수로 요구하게 되면 비즈 앱 전환 필요

### 2-2. 플랫폼 > iOS
- [ ] **번들 ID**: `com.minnnj.offmode`
- [ ] iOS 앱이 활성화 상태인지 확인

### 2-3. 플랫폼 > Android

> **iOS 단독 심사 시점에는 스킵 가능.** Apple 리뷰어는 iOS 빌드만 테스트하므로 Android Kakao 설정은 Play Store 출시 시점에 작업해도 무방.

- [ ] **패키지명**: `com.minnnj.offmode`
- [ ] **키 해시** 등록 (release keystore 기준, 필요 시 debug도)
  - 로컬 keystore에서 추출:
    ```sh
    keytool -exportcert -alias <release-alias> -keystore <release.keystore> \
      | openssl sha1 -binary | openssl base64
    ```
  - EAS Build가 keystore를 관리하는 경우 EAS 발급 keystore의 해시를 등록해야 함:
    ```sh
    eas credentials   # Android > Production > Keystore > view
    ```
- [ ] **스토어 URL** — 선택사항. Play Store 출시 전이면 비워둬도 됨. 출시 후 채우면 카카오 제품 내 앱 설치 링크에 반영됨

### 2-4. 카카오 로그인
- [ ] **[제품 설정] > [카카오 로그인] > [일반] > 사용 설정 > 상태** ON
- [ ] **OpenID Connect**: OFF여도 무방 (백엔드가 OIDC 미사용, `kapi.kakao.com/v2/user/me`로 accessToken 검증)
- [ ] **Redirect URI 등록 불필요** — `@react-native-seoul/kakao-login`은 네이티브 SDK 로그인이므로 콘솔 등록 없이 앱 스킴(`kakao62ae...://oauth`)으로 직접 동작. (REST API/웹 로그인을 추가할 때만 등록 필요)

### 2-5. 동의 항목
앱이 실제로 가져오는 사용자 정보가 콘솔에서 활성화되어 있어야 한다.
- [ ] **닉네임** (필수 동의 또는 선택 동의)
- [ ] **이메일** (선택 동의, 검수 필요) — 현재 백엔드에서 이메일을 사용하지 않으면 생략 가능
- [ ] 그 외 사용자 정보 항목 중 활성화한 게 없으면 모두 OFF인지 확인 (오버스코프 방지)

> 백엔드 `AuthService`는 Kakao userinfo의 `id`(providerId)만 필수로 쓰고 닉네임/이메일은 선택. 동의항목 변경 후 백엔드 코드도 확인.

---

## 3. Apple Developer 콘솔 체크리스트

콘솔: https://developer.apple.com/account

### 3-1. Identifiers > App IDs
- [ ] **Bundle ID**: `com.minnnj.offmode` 등록됨
- [ ] **Team**: Team ID `SX5KZM28U5` 와 일치
- [ ] **Capabilities > Sign In with Apple** ✅ 체크됨

### 3-2. Provisioning / Certificates
- [ ] 위 App ID로 발급된 **Distribution Provisioning Profile** 존재
- [ ] Sign In with Apple capability가 profile에 포함됨
- [ ] EAS Build 사용 시:
  ```sh
  eas credentials   # iOS > Production > Provisioning Profile
  ```
  capability에 `Sign In with Apple` 표시 확인

### 3-3. App Store Connect
- [ ] 앱이 등록되어 있고 Bundle ID `com.minnnj.offmode` 와 매칭
- [ ] Sign in with Apple을 **앱의 유일한 소셜 로그인이 아닌** 경우 Apple도 함께 제공해야 한다는 Guideline 4.8에 부합 (offmode는 Kakao + Apple 둘 다 제공하므로 OK)

> Apple Service ID, Key ID, P8 키는 **현재 구조상 불필요**. (백엔드가 server-to-server token exchange를 쓰지 않고 identityToken을 직접 검증)

---

## 4. 코드 ↔ 콘솔 대조 절차

심사 제출 직전, 다음 순서로 정확히 한 번 훑는다:

1. `app.json`, `ios/offmode/Info.plist`, `android/app/src/main/AndroidManifest.xml`, `backend/src/main/resources/application.yml` 의 값이 위 §1 표와 동일한지 확인
2. Kakao Developers 콘솔에서 §2 체크리스트의 각 항목을 위 §1 표 값과 대조
3. Apple Developer 콘솔에서 §3 체크리스트의 각 항목을 위 §1 표 값과 대조
4. EAS Build로 빌드한 IPA/APK의 Bundle ID/package가 §1 값과 일치 (`eas build:list` 후 상세 페이지 확인)
5. 백엔드 prod (`SPRING_PROFILES_ACTIVE=prod`)가 `apple.bundle-id=com.minnnj.offmode` 로 떠 있는지 Railway 환경변수 확인

---

## 5. 실기기 로그인 검증 절차

빌드: EAS internal 또는 TestFlight 배포.

### Apple 로그인
1. 앱 첫 실행 → 로그인 화면
2. "Apple로 계속하기" 탭
3. 시스템 시트에서 본인 Apple ID로 진행 → 이메일 공개 여부 선택
4. 앱이 홈/온보딩으로 진입
5. 백엔드 로그에서 다음이 보여야 정상:
   ```
   Apple login succeeded, userId=..., isNew=...
   ```

### Kakao 로그인
1. "Kakao로 계속하기" 탭
2. 카카오톡 앱이 설치된 기기 → 카카오톡으로 점프 → 동의 → 앱 복귀
3. 카카오톡이 없는 기기 → 웹뷰로 카카오 계정 로그인 → 앱 복귀
4. 앱이 홈/온보딩으로 진입

각 케이스에서:
- [ ] 로그인 성공 시 `/api/v1/users/me` 호출 200
- [ ] 앱 재실행 시 토큰 복원으로 자동 로그인

---

## 6. Troubleshooting (실패 시 확인 순서)

증상별로 위에서부터 확인.

### Apple 로그인 실패
1. **시트가 안 뜬다** → iOS 시뮬레이터/Expo Go 환경에서는 Sign in with Apple이 동작하지 않음. 실제 기기 + EAS dev/prod 빌드에서만 테스트.
2. **시트는 뜨는데 백엔드 400/401**
   - 백엔드 로그 `Apple identity token validation failed: ...` 메시지 확인:
     - `Audience...` → Apple Developer 콘솔 Bundle ID ≠ `apple.bundle-id` (application.yml)
     - `Issuer...` → `apple.issuer` 값 잘못됨
     - `Signature...` 또는 `keys` 관련 → Apple `keys-url` 응답 캐싱/네트워크 문제
   - `AUTH_APPLE_KEY_UNAVAILABLE` → Railway에서 `appleid.apple.com` outbound 차단 여부 확인
3. **로그인은 되는데 다음 호출에서 401** → JWT 발급/만료 문제 (Apple 콘솔과 무관)

### Kakao 로그인 실패
1. **앱이 카카오로 점프하지 않음** (커스텀 스킴 동작 X)
   - iOS: `Info.plist` URL scheme `kakao62ae...` 누락 또는 오타
   - Android: `AndroidManifest.xml` `AuthCodeHandlerActivity`의 `android:scheme` 오타
2. **카카오톡 동의 후 앱으로 안 돌아옴**
   - Android: 키 해시 미등록/불일치 → Kakao 콘솔에 release keystore 해시 등록 필요
3. **앱은 돌아왔는데 백엔드 401/400**
   - 백엔드 로그에 `KAKAO_USERINFO_FAILED` 또는 `KAKAO_INVALID_TOKEN`:
     - Kakao 콘솔 > 카카오 로그인 활성화 OFF
     - 네이티브 앱 키 불일치 (재발급된 적이 있는지 확인)
4. **이메일/닉네임이 null** → 동의항목 미설정. 현재 백엔드는 둘 다 optional 처리되므로 로그인 자체는 성공.

### 공통
- 백엔드 prod 로그: Railway > Logs
- 실패 시 원인을 알 수 없으면 백엔드 `LOG_LEVEL=DEBUG` 로 일시 변경
