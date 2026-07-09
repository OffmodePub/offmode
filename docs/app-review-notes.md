# App Store Connect — 리뷰어용 심사 노트

App Store Connect > App Information > **App Review Information** 의 *Sign-In Information* / *Notes* / *Contact* 입력용 초안.
ASC 입력 시 §2의 영문 텍스트를 그대로 복사해서 붙여 넣는다. §1·§3·§4·§5는 작성/검토/검증용 한글 메모.

리뷰어가 앱 진입에 실패하면 **Guideline 2.1 자동 리젝**. 제출 전 본인이 동일 흐름으로 한 번 시연해서 막힘 없음을 확인할 것.

---

## 1. Sign-In Information (데모 계정)

iOS 빌드의 로그인 화면(`screens/LoginScreen.jsx`)은 다음 두 경로를 노출한다.

- **Sign in with Apple** — iOS에서만 노출 (`screens/LoginScreen.jsx:50`, `Platform.OS === 'ios'`). 리뷰어 본인 Apple ID로 로그인 가능 → **Apple 정책상 별도 데모 계정 의무 없음**
- **카카오로 시작하기** — 한국 사용자용 보조 경로. 카카오 계정은 휴대폰 본인 인증이 필수이고 1번호당 1계정만 발급되므로 **리뷰어용 별도 데모 계정을 발급하기 어려움**. ASC Notes에 "Kakao는 한국 사용자용 보조 경로이며 리뷰어는 Sign in with Apple을 사용하라"고 명시해 우회

### ASC 입력값

| ASC 필드 | 입력값 |
|---|---|
| Sign-In required | **Yes** |
| User name | `See Notes — Use Sign in with Apple` |
| Password | `See Notes — Use Sign in with Apple` |
| Notes | (§2 영문 노트 전체 붙여 넣기) |

> Sign-In required를 No로 두면 일부 리뷰어가 "계정이 필요한 앱인데 No로 표기됐다"고 판단해 보충 요청을 보낼 수 있어 Yes로 두는 게 안전. 대신 username/password 자리에 "See Notes" 안내를 적어 리뷰어가 §2 Notes를 보고 SIWA로 진입하도록 유도한다.

---

## 2. Notes — 영문 (ASC 직접 입력용)

```text
Thank you for reviewing offmode.

offmode is a daily offline-mission challenge app built around "rooms".
The user creates a room - solo or with friends - and each day the room
gets one offline mission (e.g. take a short walk, visit a new cafe). The
user completes it in real life and verifies it by taking a photo with the
in-app camera. In group rooms, members react to and confirm each other's
verifications to stay motivated together.

[How to sign in]
The login screen shows two options:
- "Apple로 시작하기" (Sign in with Apple, iOS only) - PLEASE USE THIS.
  You can authenticate with your own Apple ID; no demo account needed.
- "카카오로 시작하기" (Kakao) - this is a secondary path provided for
  Korean users who already have a Kakao account. Kakao account creation
  requires Korean phone-number verification (one account per phone
  number), so we are unable to issue a reviewer demo account for this
  path. The Kakao flow is functionally identical to the Apple flow
  after login - only the identity provider differs. If you tap the
  Kakao button without a Kakao account, you will be unable to proceed,
  which is expected behavior. Please use Sign in with Apple to review
  the app.

[Walkthrough - fastest path for a reviewer]
The quickest way to see the full loop is a SOLO room, which completes
instantly without needing any other users.

1. Launch the app and tap "Apple로 시작하기" (Sign in with Apple).
2. Signup has two steps:
   Step 1 - enter a nickname and pick an avatar, then tap "다음 →".
   Step 2 - choose a "mission time" (wheel picker / presets, default
   08:00), then tap "시작하기 →". Any time is fine for the review; the
   value only controls when the daily mission notification is delivered.
   A one-time intro carousel then appears - tap through it.
3. You arrive on the Mission tab, which is the room list (home). Tap
   "새 방 만들기" (Create a room). When asked
   "누구와 함께하나요?" (Who is this with?), choose "🌙 나 혼자"
   (Just me / solo room). Give the room a name and create it.
4. Open the room. In the empty mission state, tap "오늘의 미션 정하기"
   and then "랜덤 미션 뽑기" (Pick a random mission) to assign today's
   mission. You may also use "직접 정하기" to choose one manually.
5. Tap "인증하기" (Verify). The in-app camera opens - take a photo and
   tap "인증 완료하기" to submit. In a solo room the verification is
   accepted immediately and the mission shows as completed.
6. (Optional - group features) To see the social side, create a second
   room with "👥 친구와" (With friends). It generates an invite code you
   can share. In a group room, members see each other's verifications and
   can add 🔥 reactions, tap "인증해주기" to peer-confirm a member's
   photo, and "콕 찌르기" (nudge) members who have not verified yet.

[Permissions]
- Camera: used only when the user takes a photo to verify a completed
  mission. The app uses still-photo capture only - no video, no audio,
  no background capture. (iOS NSCameraUsageDescription is localized in
  Korean: "offmode가 미션 인증을 위해 카메라에 접근합니다.")
- Photo Library: used only when the user picks an existing photo to
  verify a mission instead of taking a new one.
- Notifications: used to deliver the daily mission notification at the
  user's chosen time, and an additional 9pm reminder. Declining
  notifications does not block any feature.

[Content safety]
User-generated content (verification photos, captions, nicknames) is
shown to other members of the same room. On a verification that is not
your own, tap the "..." menu in the top-right:
- "신고하기" (Report) - choose a reason; reports are stored for operator
  review.
- "차단하기" (Block) - blocks that user; their verifications are then
  hidden from your feed. You can review and undo blocks under
  Settings > "차단한 사용자 관리" (Manage blocked users).

[Backend]
The backend runs on AWS (EC2 in ap-northeast-2 with Nginx + Let's Encrypt
HTTPS) at https://api.offmodechallenge.com. It is publicly reachable and
ready for production. No additional server setup or VPN is required from
the reviewer.

[Contact]
If anything blocks the review, please reach out to the contact email
listed in App Review Information. We will respond same-day.
```

---

## 3. Notes — 한글 검토용

위 영문 노트 요약. ASC에는 영문만 입력한다.

- 앱 소개 1줄: 방(Room) 기반 일일 오프라인 미션 챌린지. 혼자/친구와 방을 만들고 미션을 사진으로 인증, 그룹은 서로 인증·리액션·콕 찌르기
- 로그인 방법
  - **Apple SIWA 사용 강력 권장**. 리뷰어 본인 Apple ID 사용 가능
  - Kakao 경로는 한국 사용자용 보조. 한국 휴대폰 본인 인증 필수 + 1번호당 1계정 제약으로 리뷰어용 데모 계정 발급 불가 → Notes에 "Kakao 버튼 누르면 진입 못 하는 게 정상이고 SIWA 사용해달라"고 명시
- 리뷰어용 최단 플로우 (SOLO 방은 즉시 인증 완료라 다른 유저 불필요)
  1. 로그인 화면에서 "Apple로 시작하기" 탭
  2. 회원가입 2-step (Step1 닉네임/아바타 `다음 →` / Step2 미션시간 5분 단위 `시작하기 →`, 아무 시각 OK) + 인트로 캐러셀 → Mission 탭(= 방 목록/홈) 진입
  3. "새 방 만들기" → "누구와 함께하나요?"에서 **"🌙 나 혼자"** 선택 → 방 생성
  4. 방 진입 → "오늘의 미션 정하기" → **"랜덤 미션 뽑기"**(또는 "직접 정하기")로 오늘 미션 배정
  5. "인증하기" → 카메라 → 사진 촬영 → "인증 완료하기" → **SOLO는 즉시 인증 완료**
  6. (선택) "👥 친구와" 방을 하나 더 만들면 초대코드 발급 → 그룹에서 리액션(🔥)·"인증해주기"(피어 확인)·"콕 찌르기"(미인증 멤버 독려) 확인 가능
- 권한 사유
  - 카메라: 미션 인증용 사진 촬영 전용. 비디오/마이크/백그라운드 캡처 없음. iOS 시스템 다이얼로그 사유는 한국어로 로컬라이즈됨
  - 사진 라이브러리: 새로 찍는 대신 기존 사진으로 인증할 때만 사용
  - 알림: 사용자 설정 미션 시간에 미션 알림 (`daily-mission`) + 21시 고정 리마인더 (`daily-reminder`). 거부해도 모든 기능 정상 동작
- 백엔드: AWS EC2 + Nginx + Let's Encrypt HTTPS (`https://api.offmodechallenge.com`). 리뷰어 별도 설정 불필요
- 연락처: ASC Contact 이메일로 답변 (당일 회신)

---

## 4. 권한 사유 (Source of Truth)

ASC Notes에 적은 권한 설명과 `app.json` / 코드의 사유 문구가 일치해야 한다.

출처는 라인 번호 대신 JSON 경로로 표기 (라인 번호는 파일 변경에 따라 어긋나기 쉬움).

| 권한 | repo 문구 | 출처 (`app.json`) | 영문 ASC Notes 대응 |
|---|---|---|---|
| iOS 카메라 | "offmode가 미션 인증을 위해 카메라에 접근합니다." | `expo.plugins["expo-camera"].cameraPermission` | "used only when the user takes a photo to verify a completed mission" |
| iOS 마이크 | 미사용 — 권한 요청 자체 없음 | `expo.plugins["expo-camera"].microphonePermission` (= `false`) | "no audio" |
| iOS 알림 | (별도 사유 문구 없음 — 시스템 기본) | `expo.plugins["expo-notifications"]` | "deliver the daily mission notification + 9pm reminder" |
| Android 카메라 | — | `expo.android.permissions[]` 의 `android.permission.CAMERA` | (Android 심사 무관) |
| Android RECORD_AUDIO | — | `expo.android.permissions[]` 의 `android.permission.RECORD_AUDIO` | (Android 심사 무관, expo-camera Android 기본 추가) |

> **주의**: iOS 카메라 사유 문구가 한국어로만 정의되어 있다. 영어 시스템 언어로 설정된 리뷰어 기기에서는 한국어 문구가 그대로 다이얼로그에 표시될 수 있다.
> 이번 심사 제출에서는 §2 영문 Notes에 사유를 풀어 적어 리뷰어가 의도를 이해할 수 있게 한다.
> 별도 후속 이슈로 영문 NSCameraUsageDescription 추가를 검토한다.

---

## 5. 제출 전 본인 시연 체크리스트

ASC 입력 직전, 본인 Apple ID로 다음 흐름을 한 번 끝까지 통과한다.
**리뷰어가 실제로 따라갈 경로(SIWA)** 와 **본인 카카오 계정으로 Kakao 경로** 둘 다 한 번씩 검증한다.

### Apple 경로 (리뷰어가 따라갈 경로)
- [ ] 로그인 화면 → "Apple로 시작하기" 탭 → Sign in with Apple 다이얼로그 정상 진행
- [ ] 회원가입 Step 1 (닉네임 입력 + 아바타 선택) → "다음 →" 탭
- [ ] 회원가입 Step 2 (미션 시간 선택) → "시작하기 →" 탭
- [ ] 인트로 캐러셀 → Mission 탭(방 목록) 진입
- [ ] "새 방 만들기" → "🌙 나 혼자" 선택 → 방 이름 입력 → 생성
- [ ] 방 진입 → "오늘의 미션 정하기" → "랜덤 미션 뽑기"로 미션 배정
- [ ] "인증하기" → 카메라 권한 다이얼로그 → 허용 → 사진 촬영 → "인증 완료하기"
- [ ] SOLO 방 즉시 인증 완료 상태로 전환
- [ ] (선택) "👥 친구와" 방 생성 → 초대코드 발급 확인 → 그룹 리액션/인증해주기/콕 찌르기 노출
- [ ] Settings 탭 → 로그아웃 정상 동작
- [ ] 회원탈퇴 정상 동작 (별도 계정으로 재검증)

### Kakao 경로 (본인 카카오 계정)
리뷰어용 데모 계정은 발급하지 않지만, 출시 후 한국 사용자가 사용할 경로이므로 본인 카카오 계정으로 동일 흐름 검증.
- [ ] 로그인 화면 → "카카오로 시작하기" 탭 → 카카오 로그인 다이얼로그 정상 진행
- [ ] (위 Apple 경로 2~10 동일)

> 어느 한 단계라도 막히면 ASC 제출 보류. 막힌 원인을 해결한 뒤 같은 흐름을 다시 통과시킨다.
