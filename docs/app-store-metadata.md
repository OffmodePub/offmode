# App Store Connect — 제출 메타데이터

iOS 첫 심사 제출용 ASC 입력값 초안.
ASC의 한국어(기본) 로케일에 입력할 텍스트와 프라이버시 설문 답안, 카테고리/연령 결정 근거를 한 곳에 정리한다.

> 영문 로케일을 추가 등록할지는 첫 출시 시점에는 보류 (한국 시장 우선). 추후 확장 시 본 문서 영문판 추가.

---

## 1. 텍스트 메타데이터

### 1-1. 앱 이름
| ASC 필드 | 입력값 |
|---|---|
| Name (Korean) | **오프모드** |
| Subtitle (Korean) | **매일 하나의 오프라인 미션** (§1-2 추천안 확정) |

> 영문 로케일 추가 시 Name = `offmode`. 첫 출시는 한국어 단일 로케일로 진행 권장.

### 1-2. 부제 / Subtitle (30자 이내)
**확정: "매일 하나의 오프라인 미션"** (13자)

선정 근거: 검색 노출 키워드 ("매일", "오프라인", "미션")를 다 포함하고 가장 직설적.

다른 후보 (참고용 / 다음 버전에 A/B 테스트할 때):

| 후보 | 글자 수 | 톤 |
|---|---|---|
| 오프라인으로 시작하는 하루 | 13 | 라이프스타일 |
| 랜덤 미션과 사진 인증으로 갓생 | 16 | 트렌디 |
| 잠시 폰을 내려놓는 시간 | 12 | 디지털 디톡스 |

### 1-3. 키워드 (100자, 콤마 구분)
ASC Keywords 필드는 **100자**까지, 콤마 구분. 띄어쓰기 없이 작성하면 글자 수 절약.

```text
미션,챌린지,오프라인,갓생,루틴,습관,자기관리,사진인증,데일리,동기부여,디지털디톡스,라이프스타일,피드,인증
```

길이 확인: 위 문자열은 약 73자. 여유 27자.

> 부제·앱이름에 들어간 단어는 키워드에서 빼는 게 ASO상 유리하다는 통설이 있지만 Apple 공식 가이드는 강제하지 않음. 첫 출시는 위 그대로 진행하고 데이터 보고 조정.

### 1-4. 앱 설명 (4000자 이내)
**초안** — 800자 내외. ASC에 그대로 붙여 넣고 출시 후 데이터 보며 다듬는다.

```text
오프모드는 매일 하나의 랜덤 오프라인 미션을 받아 사진으로 인증하는
챌린지 앱입니다.

오늘은 어떤 미션이 나에게 도착할까요? 산책, 책 한 페이지 읽기,
물 마시기처럼 폰을 내려놓고 잠시 오프라인으로 보낼 수 있는 작은
미션들이 매일 룰렛으로 도착합니다.

[핵심 기능]
• 매일 자동 도착하는 랜덤 미션 — 내가 정한 시간에 룰렛이 돌아갑니다
• 사진으로 미션 인증 — 카메라로 한 장 찍으면 끝
• 피드 — 같은 시간을 보내는 다른 오프모더들의 인증을 보고 이모지로
  응원할 수 있어요
• 피어 인증 — 다른 사용자의 미션을 함께 확인해주며 서로 동기를 주고
  받습니다
• 연속 기록 / 레벨 — 매일 조금씩 쌓이는 흔적을 눈으로 확인하세요

[이런 분께 추천해요]
• 폰을 너무 오래 보는 자신이 신경 쓰이는 분
• 거창한 챌린지보다 매일 작은 행동을 쌓고 싶은 분
• 혼자가 아니라 누군가와 함께 가볍게 동기부여 받고 싶은 분

[프라이버시]
오프모드는 광고나 분석을 위한 추적을 하지 않습니다. 카메라 권한은
미션 인증 사진 촬영에만 사용되고, 사진은 사용자가 명시적으로
업로드한 것만 서버에 저장됩니다. 자세한 내용은 개인정보 처리방침을
확인해주세요.

오프라인을 시작하세요. 오프모드.
```

### 1-5. 카테고리
| ASC 필드 | 입력값 | 근거 |
|---|---|---|
| Primary Category | **Lifestyle** | 일일 습관/자기관리/디지털 디톡스 컨셉 |
| Secondary Category | **Health & Fitness** | "산책", "물 마시기" 등 건강 미션 비중 큼. Social Networking은 피드 의존도가 더 큰 앱에 적합 |

### 1-6. 연령 등급
| ASC 필드 | 답안 |
|---|---|
| User-Generated Content (사용자 생성 콘텐츠) | **Yes** (미션 인증 사진 / caption / 닉네임) |
| 신고·차단·모더레이션 | **현재 미구현** |
| 결과 권장 등급 | **17+** |

> ⚠️ **리젝 리스크**: Apple은 사용자 간 콘텐츠 공유 + 모더레이션 부재 조합을 Guideline 1.2 / 5.6.1로 리젝하는 경우가 많다.
> **본 심사 제출 시 17+로 표기**하고, 출시 후 후속 이슈로 **신고·차단·욕설 필터** 기능을 추가해 다음 버전에서 등급을 낮추는 게 안전.

### 1-7. 지원 URL (필수) / 개인정보 처리방침 URL
| ASC 필드 | 값 |
|---|---|
| Support URL | `https://github.com/OffmodePub/offmode/issues` |
| Marketing URL (선택) | 비워둠 |
| Privacy Policy URL | `https://fuchsia-belief-040.notion.site/OFFMODE-34309a0b0e3e809b965bd62530627431` (`app.json` `expo.ios.privacyPolicyUrl`, `SettingsScreen.jsx:284`) |

> Support URL이 public GitHub repo의 Issues 페이지를 가리키므로 리뷰어가 접근 가능. Issues 탭이 비활성화되어 있지 않은지 제출 직전 확인할 것.

### 1-7-a. 참고: 앱 내 노출되는 약관·처방침 URL
ASC 메타데이터 필드는 아니지만 앱 내 일관성 확인용. 모두 Notion 동일 워크스페이스에 있음.

| 항목 | URL | 노출 위치 |
|---|---|---|
| 개인정보 처리방침 | `https://fuchsia-belief-040.notion.site/OFFMODE-34309a0b0e3e809b965bd62530627431` | `SettingsScreen.jsx:284`, `app.json` `expo.ios.privacyPolicyUrl` |
| 서비스 이용약관 | `https://fuchsia-belief-040.notion.site/35f09a0b0e3e80ffa48fde51b2de125b` | `SettingsScreen.jsx:290` |
| 문의하기 | `https://fuchsia-belief-040.notion.site/Off-Mode-35f09a0b0e3e80af81a8ce27d686fd7d` | `SettingsScreen.jsx:296` |

> `LoginScreen.jsx:70-72` 의 "서비스 이용약관 및 개인정보 처리방침에 동의" 문구는 클릭 가능한 링크가 아니지만, 위 URL들이 Settings 탭에서 모두 접근 가능하므로 Apple 정책상 문제 없음.

### 1-8. What's new in this version
첫 출시 버전. 짧게:

```text
오프모드 첫 출시예요. 매일 한 번, 오프라인 미션을 시작해보세요.
```

---

## 2. App Privacy 설문 답안

ASC > App Privacy 페이지에서 입력. 각 데이터 카테고리에 대해 "수집함 / 수집 안 함"을 답한 뒤, 수집한다고 답한 항목에 대해 **(a) 사용 목적**, **(b) 사용자와 연결 여부**, **(c) 추적 목적 사용 여부**를 추가로 답한다.

### 2-1. 수집하는 데이터

| 카테고리 | 세부 항목 | 사용 목적 | 사용자와 연결 | 추적 목적 |
|---|---|---|---|---|
| **Contact Info** | Email Address | App Functionality | Yes | No |
| **User Content** | Photos or Videos | App Functionality | Yes | No |
| **User Content** | Other User Content (닉네임, 미션 caption) | App Functionality | Yes | No |
| **Identifiers** | User ID (OAuth `providerId`, 내부 `User.id`) | App Functionality | Yes | No |
| **Usage Data** | Product Interaction (미션 완료, 리액션, 피어 인증 이벤트) | App Functionality | Yes | No |

> **수집 출처 (백엔드 검증)**:
> - Email / User ID → `AuthService.kakaoLogin`, `AuthService.appleLogin` 에서 OAuth provider 응답으로부터 받아 `User` 엔티티 (`User.email`, `User.providerId`, `User.id`) 에 저장
> - 닉네임 → `User.name`
> - 사진 → `Verification.photoUrl` (Cloudflare R2 또는 로컬)
> - 미션 caption → `Verification.caption`
> - Product Interaction → `UserMission`, `Verification`, `VerificationConfirm`, `Reaction` 엔티티의 활동 로그

### 2-2. 수집하지 않는 데이터
참고용. ASC 설문에서 "수집 안 함"으로 답할 카테고리들.

- **Health & Fitness** (걸음 수 등) — HealthKit 미사용
- **Financial Info** — 결제 없음, in-app purchase 없음
- **Location** — GPS/위치 권한 사용 안 함
- **Sensitive Info** — 인종/종교/성지향성 등 미수집
- **Contacts** — 주소록 권한 사용 안 함
- **Search History** — 미수집
- **Browsing History** — 미수집
- **Diagnostics** — Sentry 등 크래시 리포트 SDK 없음

### 2-3. Tracking 여부
| ASC 필드 | 답안 | 근거 |
|---|---|---|
| Used to Track You | **No** | `package.json` 의존성에 Firebase/Amplitude/Mixpanel/Adjust/AppsFlyer/Branch/Facebook SDK 등 분석·광고·추적 SDK 전무. `expo-tracking-transparency` 미사용 → ATT 다이얼로그 불필요. IDFA 미사용 |

---

## 3. 이미지 / 아이콘

### 3-1. App Store 마케팅 아이콘
- **사이즈**: 1024×1024 px
- **포맷**: PNG, **알파 채널 없음**, **둥근 모서리 직접 적용하지 말 것** (Apple이 자동 처리)
- **출처**: `assets/icon.png` 기반으로 알파/모서리 제거한 마케팅 전용 버전을 별도로 만들 것

### 3-2. iPhone 스크린샷 (필수 — 최소 1세트)
| 디바이스 | 사이즈 | 비고 |
|---|---|---|
| 6.7" iPhone (Pro Max) | 1290×2796 px | 필수, 3~10장 |
| 6.5" iPhone (XS Max 등) | 1242×2688 px | 필수, 3~10장 (6.7"용을 자동 스케일로 대체 가능한 경우도 있음, 단 보통 별도 캡처 권장) |

### 3-3. 캡처할 화면 후보 (5장 기준)
1. **로그인 화면** — 첫인상 + 다크모드 브랜딩
2. **미션 화면 (미션 받은 상태)** — 핵심 가치 "오늘의 미션"
3. **카메라 + 인증 흐름** — 미션 인증 UX
4. **피드 화면** — 커뮤니티 측면
5. **프로필 화면** — 연속 기록, 레벨, 아바타

> 시뮬레이터에서 `Cmd+S`로 캡처. 상태바를 깨끗하게 (시간 9:41, 배터리 풀) 보이게 하려면 `xcrun simctl status_bar` 명령으로 강제 가능. 별도 후속 작업으로 캡처/마케팅 카피 입히는 단계 필요.

---

## 4. 후속 작업 / 별도 이슈 가치

심사 제출 자체에는 영향 없지만 다음 버전 작업 가치 있는 항목.

- **신고 / 차단 / 모더레이션 기능 추가** → 연령 등급을 12+ 이하로 낮춰 잠재 사용자 풀 확대 (현재는 17+ 권장)
- **개인정보 처리방침·이용약관을 ASC와 일관된 한글/영문 양면 페이지로 정비** (현재 Notion 단일 한글 페이지)
- **`LoginScreen` 약관 동의 문구를 클릭 가능한 링크로** — 현재 평문이라 사용자가 약관을 보려면 가입 후 Settings 탭으로 가야 함 (UX 개선, 리젝 리스크 아님)

---

## 5. 결정 보류 항목 (ASC 입력 전 마무리)

- [x] ~~Subtitle 선택~~ → "매일 하나의 오프라인 미션" 확정
- [x] ~~Support URL 결정~~ → GitHub Issues 확정
- [x] ~~이용약관 URL 부재 처리~~ → 이미 `SettingsScreen.jsx:290` 에 존재 (§1-7-a). 별도 작업 불필요
- [ ] **신고/차단 기능 부재로 17+ 표기**: 본 심사를 17+로 제출할지, 신고 기능 먼저 구현하고 12+로 출시 시점을 미룰지 결정 필요

---

## 6. 제출 직전 체크리스트

ASC 입력 후 "심사 제출" 직전 마지막 점검.

- [ ] 한국어 로케일에 §1의 모든 필드 입력 완료
- [ ] App Privacy 설문이 §2 표와 일치하게 입력됨
- [ ] 1024 아이콘 / 6.7" 스크린샷 3장 이상 업로드됨
- [ ] Support URL이 실제 접근 가능한 페이지를 가리킴
- [ ] Privacy Policy URL이 실제 접근 가능한 페이지를 가리킴
- [ ] [`app-review-notes.md`](./app-review-notes.md) §1의 Sign-In Information 입력 완료
- [ ] [`app-review-notes.md`](./app-review-notes.md) §2의 영문 Notes 가 App Review Information > Notes 에 그대로 입력됨
- [ ] 빌드 업로드(EAS Submit)가 ASC에 도달함
- [ ] 본인이 [`app-review-notes.md`](./app-review-notes.md) §5의 시연 체크리스트를 한 번 통과함
