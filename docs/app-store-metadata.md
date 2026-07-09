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

### 1-2-a. 프로모션 텍스트 (Promotional Text, 170자 이내)
ASC의 별도 필드. 앱 심사 없이 언제든 교체 가능하므로 시즌/이벤트 문구로 갱신하기 좋다.

```text
스크린 OFF, 일상 ON. 혼자 또는 친구와 방을 만들고 매일 하나의 미션을 사진으로 인증해요. 🔥 리액션으로 응원하고, 안 한 친구는 콕 찔러 재촉하며 함께라서 더 꾸준하게.
```

### 1-3. 키워드 (100자, 콤마 구분)
ASC Keywords 필드는 **100자**까지, 콤마 구분. 띄어쓰기 없이 작성하면 글자 수 절약.

```text
미션,챌린지,갓생,습관,루틴,인증,디지털디톡스,자기계발,친구,동기부여,사진,데일리,오프라인,목표,함께
```

길이 확인: 위 문자열은 약 88자. 여유 12자. 방(Room)·소셜 성격을 살려 "친구·함께·동기부여"를 넣고, 현재 UX에서 빠진 개인 룰렛/카테고리 관련어 대신 습관·인증 축으로 정리.

> 부제·앱이름에 들어간 단어는 키워드에서 빼는 게 ASO상 유리하다는 통설이 있지만 Apple 공식 가이드는 강제하지 않음. 첫 출시는 위 그대로 진행하고 데이터 보고 조정.

### 1-4. 앱 설명 (4000자 이내)
**초안** — 방(Room) 중심 구조 기준. ASC에 그대로 붙여 넣고 출시 후 데이터 보며 다듬는다.

```text
📸 스크린 OFF. 일상 ON.
매일 하나의 미션을 사진으로 인증하는 오프모드

폰만 보던 하루에서 한 걸음 나가보세요.
오프모드는 혼자 또는 친구와 '방'을 만들어 매일 하나의 오프라인 미션을 사진으로 인증하는 앱이에요.

동네 한 바퀴 산책하기처럼 작지만 확실한 미션 하나로 오늘 하루가 어제와 달라져요.

■ 이렇게 즐겨요

1. 혼자 또는 친구와 방을 만들어요
2. 오늘의 미션을 정해요 — 랜덤으로 뽑거나 직접 골라요
3. 미션을 완료하고 사진으로 인증해요
4. 서로 인증을 확인하며 🔥 리액션으로 응원해요
5. 아직 안 한 친구는 콕 찔러 살짝 재촉해요

■ 혼자도, 친구와 함께도

'나 혼자' 방에서는 나만의 루틴을 조용히 쌓아가고, '친구와' 방에서는 초대코드로 친구를 불러 같은 미션에 함께 도전해요.

혼자 하면 사진만 올려도 바로 인증 완료, 함께하면 멤버들이 서로의 인증을 확인해주는 '인증해주기'로 더 단단하게 이어져요.

■ 함께라서 더 꾸준히

· 🔥 리액션으로 서로의 미션을 응원해요
· 콕 찌르기로 아직 안 한 친구를 살짝 재촉해요
· 연속 인증을 이어가며 나만의 기록을 쌓아요
· 인증을 거듭할수록 나만의 캐릭터를 꾸밀 수 있는 아이템이 하나씩 열려요

■ 이런 분께 추천해요

· 스마트폰 사용 시간을 줄이고 싶은 분
· 작심삼일 없이 꾸준한 습관을 만들고 싶은 분
· 친구와 서로 동기부여를 주고받고 싶은 분
· 매일 조금씩 새로운 걸 시도하고 싶은 분

지금, 화면 밖으로 한 걸음 나가볼까요?
오늘의 미션이 방에서 기다리고 있어요.
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
| 신고 기능 | **구현됨 (부분)** — 방 인증(사진/캡션/닉네임)에 한해 신고 가능. `ProofDetailScreen`의 `...` 메뉴 → `ReportReasonModal`(사유 5종+기타) → `POST /api/v1/rooms/{roomId}/proofs/{proofId}/report`. **본인 인증 제외**. 신고 시 콘텐츠 자동 숨김은 없음(운영자 수동 검토 전제) |
| 차단 기능 | **구현됨** — 사용자 차단(Block). `ProofDetailScreen`의 `...` 메뉴 → "차단하기" → `POST /api/v1/users/{userId}/block`. 차단 시 해당 유저의 방 인증이 피드에서 숨겨짐(`RoomService.getDetail` 필터). Settings > "차단한 사용자 관리"(`BlockedUsersScreen`)에서 목록 확인·해제 |
| 자동 필터 | 미구현 (다음 버전 후속) |
| 연락처 노출 | Settings > "문의하기" (`screens/SettingsScreen.jsx`) |
| **결과 표기 등급** | **12+** |

> **Apple Guideline 1.2 충족 현황**: UGC 앱은 (1) 부적절 콘텐츠 필터, (2) 신고 기능, (3) **학대 사용자 차단 기능**, (4) 연락처의 모더레이션 메커니즘을 요구한다. 현재 상태:
> - ✅ **신고**: 방 인증 콘텐츠에 한해 구현됨 (위 표)
> - ✅ **차단**: 구현됨 — 인증 상세 `...` → 차단, 차단 유저 인증은 피드에서 숨김, Settings에서 관리/해제
> - ✅ **연락처**: Settings "문의하기"
> - ❌ 자동 필터 / 신고 후 자동 숨김: 없음 (다음 버전 후속)
>
> Guideline 1.2 핵심 3요소(신고·차단·연락처)를 충족. 자동 필터만 후속 과제로 남음. 신고 진입점은 현재 방 인증에만 있고 타인 프로필(`ProfileScreen`)에는 없어, 다음 버전에 프로필 등 다른 UGC 노출 지점에도 신고/차단 진입점 추가 검토.

### 1-7. 지원 URL (필수) / 개인정보 처리방침 URL
| ASC 필드 | 값 |
|---|---|
| Support URL | `https://github.com/OffmodePub/offmode/issues` |
| Marketing URL (선택) | 비워둠 |
| Privacy Policy URL | `https://fuchsia-belief-040.notion.site/OFFMODE-34309a0b0e3e809b965bd62530627431` (`app.json` `expo.ios.privacyPolicyUrl` — 앱 내 노출 위치는 §1-7-a) |

> Support URL이 public GitHub repo의 Issues 페이지를 가리키므로 리뷰어가 접근 가능. Issues 탭이 비활성화되어 있지 않은지 제출 직전 확인할 것.

### 1-7-a. 참고: 앱 내 노출되는 약관·처리방침 URL
ASC 메타데이터 필드는 아니지만 앱 내 일관성 확인용. 모두 Notion 동일 워크스페이스에 있음.

| 항목 | URL | 노출 위치 |
|---|---|---|
| 개인정보 처리방침 | `https://fuchsia-belief-040.notion.site/OFFMODE-34309a0b0e3e809b965bd62530627431` | `screens/SettingsScreen.jsx` ("개인정보 처리방침" Section), `app.json` `expo.ios.privacyPolicyUrl` |
| 서비스 이용약관 | `https://fuchsia-belief-040.notion.site/35f09a0b0e3e80ffa48fde51b2de125b` | `screens/SettingsScreen.jsx` ("서비스 이용약관" Section) |
| 문의하기 | `https://fuchsia-belief-040.notion.site/Off-Mode-35f09a0b0e3e80af81a8ce27d686fd7d` | `screens/SettingsScreen.jsx` ("문의하기" Section) |

> `screens/LoginScreen.jsx` 의 "서비스 이용약관 및 개인정보 처리방침에 동의" 문구는 클릭 가능한 링크가 아니지만, 위 URL들이 Settings 탭에서 모두 접근 가능하므로 Apple 정책상 문제 없음.

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
2. **방 목록(RoomListScreen)** — 홈. "나의 방 / 함께하는 방", 슬로건 "스크린 OFF. 일상 ON."
3. **방 상세(RoomDetailScreen)** — 오늘의 미션 + 멤버 인증 피드/리액션·콕 찌르기 (핵심 소셜 화면)
4. **카메라 + 인증 흐름(RoomVerifyScreen)** — 미션 인증 UX
5. **프로필 화면(ProfileScreen)** — 연속 기록, 통계, 캐릭터 꾸미기/아바타

> 시뮬레이터에서 `Cmd+S`로 캡처. 상태바를 깨끗하게 (시간 9:41, 배터리 풀) 보이게 하려면 `xcrun simctl status_bar` 명령으로 강제 가능. 별도 후속 작업으로 캡처/마케팅 카피 입히는 단계 필요.

---

## 4. 후속 작업 / 별도 이슈 가치

- **자동 욕설/부적절 콘텐츠 필터 + 신고 후 자동 숨김** → Guideline 1.2 나머지 조건 충족, 12+ 등급 안정성 강화 (다음 버전)
- **신고/차단 진입점 확대** → 현재 방 인증(`ProofDetailScreen`)에만 있음. 타인 프로필(`ProfileScreen`) 등 다른 UGC 노출 지점에도 추가
- **개인정보 처리방침·이용약관을 ASC와 일관된 한글/영문 양면 페이지로 정비** (현재 Notion 단일 한글 페이지)
- **`LoginScreen` 약관 동의 문구를 클릭 가능한 링크로** — 현재 평문이라 사용자가 약관을 보려면 가입 후 Settings 탭으로 가야 함 (UX 개선, 리젝 리스크 아님)

---

## 5. 결정 보류 항목 (ASC 입력 전 마무리)

- [x] ~~Subtitle 선택~~ → "매일 하나의 오프라인 미션" 확정
- [x] ~~Support URL 결정~~ → GitHub Issues 확정
- [x] ~~이용약관 URL 부재 처리~~ → 이미 `screens/SettingsScreen.jsx` 에 존재 (§1-7-a). 별도 작업 불필요
- [x] ~~연령 등급 결정~~ → **12+**
- [x] ~~콘텐츠 신고 기능 구현~~ ([[#71]]) → **완료** (방 인증 한정, §1-6). 코드 확인됨
- [x] ~~사용자 차단(Block) 기능 구현~~ → **완료**. 인증 상세 `...` → 차단, 차단 유저 인증 피드 숨김, Settings "차단한 사용자 관리"에서 관리. 회원탈퇴 시 차단·방 도메인 FK 정리도 함께 수정(탈퇴 실패 방지)

### 선결 작업 (ASC 제출 전 필수)

- [x] ~~Guideline 1.2 모더레이션(신고·차단·연락처)~~ → **충족**. 자동 필터만 후속 과제(§4)

---

## 6. 제출 직전 체크리스트

ASC 입력 후 "심사 제출" 직전 마지막 점검.

- [ ] 한국어 로케일에 §1의 모든 필드 입력 완료
- [ ] App Privacy 설문이 §2 표와 일치하게 입력됨
- [ ] 1024 아이콘 / 6.7" 스크린샷 3장 이상 업로드됨
- [ ] Support URL이 실제 접근 가능한 페이지를 가리킴
- [ ] Privacy Policy URL이 실제 접근 가능한 페이지를 가리킴
- [ ] [`app-review-notes.md`](./app-review-notes.md) §1의 Sign-In Information 입력 완료
- [ ] [`app-review-notes.md`](./app-review-notes.md) §2의 영문 Notes가 App Review Information > Notes에 그대로 입력됨
- [ ] 빌드 업로드(EAS Submit)가 ASC에 도달함
- [ ] 본인이 [`app-review-notes.md`](./app-review-notes.md) §5의 시연 체크리스트를 한 번 통과함
