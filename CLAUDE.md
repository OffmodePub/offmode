# offmode — CLAUDE.md

## 앱 개요

매일 하나의 랜덤 오프라인 미션을 뽑아 사진으로 인증하는 챌린지 앱.
- **프론트**: React Native (Expo 52, JSX — TypeScript 아님)
- **백엔드**: Spring Boot 3.2.5 / Java 21
- **DB**: dev → H2 파일 DB / prod → MySQL (Railway)
- **이미지 저장**: Cloudflare R2 (없으면 로컬 `./uploads` fallback)
- **배포**: Railway (백엔드), EAS Build (앱)

---

## 프론트엔드 규칙

### 파일 구조
```
screens/      # 화면 단위 컴포넌트 (Screen당 1파일)
components/   # 재사용 컴포넌트
utils/        # api.js, auth.js, ThemeContext.js, haptics.js 등
constants/    # colors.js
fonts/        # Kkukkukk 폰트
```

### 텍스트는 반드시 T 컴포넌트 사용
`components/ThemedText.js`의 `<T>` 컴포넌트로 모든 텍스트를 렌더링한다.
`<Text>`를 직접 쓰지 않는다.

```jsx
import T from '../components/ThemedText';

<T v="heading">제목</T>
<T v="body">본문</T>
<T v="sub">보조 텍스트</T>
<T v="btn">버튼 텍스트</T>

// size, color prop으로 오버라이드 가능
<T v="body" size={18}>큰 본문</T>
<T v="sub" color={C.green}>초록 보조</T>
```

**v 값 목록 및 기본값**:
| v | fontSize | color |
|---|---|---|
| `logo` | 34 | green, italic |
| `heading` | 26 | text |
| `title` | 20 | text |
| `section` | 15 | text |
| `body` | 14 | text |
| `sub` | 13 | textSub |
| `label` | 12 | textSub |
| `caption` | 11 | textSub |
| `green` | 14 | green |
| `purple` | 14 | purple |
| `blue` | 14 | blue |
| `green16` | 16 | green |
| `mission` | 26 | text, center |
| `stat` | 32 | text |
| `btn` | 16 | #000 |
| `ticker` | 13 | green |

### 색상은 useTheme() / useColors() 사용
```jsx
const { colors: C, scheme } = useTheme();  // 색상 + 다크/라이트 여부 둘 다 필요할 때
const C = useColors();                      // 색상만 필요할 때
```

**색상 토큰**:
- `C.bg`, `C.surface`, `C.surface2` — 배경
- `C.green`, `C.greenFaint`, `C.greenBorder` — 주 강조색 (Vitality)
- `C.purple`, `C.purpleFaint`, `C.purpleBorder` — 보조 강조색 (Intellect)
- `C.blue`, `C.blueFaint`, `C.blueBorder` — 3번째 강조색 (Energy)
- `C.danger` — 오류/삭제 등 위험 상태
- `C.text`, `C.textSub` — 텍스트
- `C.border` — 구분선
- `C.isDark` — 다크모드 여부 boolean

하드코딩된 색상값을 쓰지 않는다. 반드시 위 토큰을 사용한다.
단, 그린 버튼 배경(`#22c97a`), 검정 버튼 텍스트(`#000`)는 고정값 허용.

### 스타일 작성 패턴
모든 화면에서 `makeStyles(C)` 함수 + `useMemo`로 스타일을 정의한다.
색상이 바뀔 때 자동으로 스타일이 재계산된다.

```jsx
export default function MyScreen() {
  const C = useColors();
  const s = useMemo(() => makeStyles(C), [C]);
  // ...
}

function makeStyles(C) {
  return StyleSheet.create({
    card: { backgroundColor: C.surface, borderColor: C.border },
  });
}
```

스타일 객체가 여러 개 필요하면 `makeAllStyles(C)`로 묶어서 반환한다.

```jsx
function makeAllStyles(C) {
  const s = StyleSheet.create({ ... });
  const card = StyleSheet.create({ ... });
  return { s, card };
}
// 사용: const { s, card } = useMemo(() => makeAllStyles(C), [C]);
```

### 네비게이션 패턴
탭 화면과 스택(오버레이) 화면 두 가지 방식으로 구성된다.

**탭 화면 추가**: `App.jsx`의 `TABS` 배열에 항목 추가 후 탭 렌더링 분기에 추가
```jsx
const TABS = [
  { key: 'newTab', label: '[NEW]', ionicon: 'star-outline' },
  // ...
];
// AppInner 탭 렌더링 분기에 추가
{tab === 'newTab' && <NewScreen />}
```

**스택(오버레이) 화면 추가**: `push` / `pop`으로 전환
```jsx
// 열기
push('myScreen')   // → currentStack === 'myScreen'

// App.jsx 스택 분기에 추가
{currentStack === 'myScreen' && (
  <View style={StyleSheet.absoluteFillObject}>
    <MyScreen onBack={pop} />
  </View>
)}
```

스택 화면이 열려 있는 동안 탭바는 자동으로 숨겨진다.

### 인증 상태머신 (App.jsx)
`AppInner`의 `authStatus`로 최상위 화면을 분기한다. 네 가지 상태만 존재한다.

| authStatus | 표시 화면 | 진입 조건 |
|---|---|---|
| `loading` | (스플래시) | 앱 시작 직후, 토큰 복원 중 |
| `unauthenticated` | `LoginScreen` | 토큰 없음 / 자동 로그인 실패 |
| `signingUp` | `SignupScreen` | 로그인 응답의 `isNew === true` |
| `authenticated` | 메인 탭 UI | 로그인 성공 + 프로필 로드 완료 |

- 카카오·Apple 로그인 응답은 `{ token, user, isNew }` 형태. `isNew`로 신규/기존 분기.
- 로그아웃 시 `cancelMissionNotification()` → `clearToken()` → 상태 초기화 → `setAuthStatus('unauthenticated')` 순서를 지킨다.
- 자동 로그인 흐름은 `useEffect`에서 `loadToken()` → `/api/v1/users/me` → `loadTodayMission()` → `scheduleMissionNotification()`로 이어진다. 새 사용자 설정 필드가 생기면 이 자동 로그인 분기와 카카오/Apple 로그인 분기 두 군데를 동시에 손봐야 한다.

### 미션 룰렛 자동 트리거 정책
`App.jsx`의 1초 간격 인터벌이 `missionTime` 도달을 감지해서 룰렛을 띄운다. 룰렛이 **다시 트리거되지 않는** 조건:

- 같은 분(`HH:MM`) 안에 이미 한 번 트리거됨 (`lastTriggeredRef`)
- 오늘 미션이 이미 있음 (`hasMission === true`) — **시간을 변경해도 재트리거하지 않는다**

따라서 "미션 시간 바꾸면 즉시 룰렛" 같은 UX는 명시적으로 `setShowRoulette(true)`를 호출해야 한다. `MissionScreen`의 `onOpenRoulette` prop이 그 경로.

### API 호출
```js
import { api } from '../utils/api';

api.get('/api/v1/...')
api.post('/api/v1/...', body)
api.put('/api/v1/...', body)
api.delete('/api/v1/...')
api.upload('/api/v1/...', formData)
```

API 주소는 `utils/api.js`를 직접 수정하지 않고 Expo 공개 환경 변수로 설정한다. `BASE_URL`은 `__DEV__` 여부로 dev/prod 분기된다 (`utils/api.js`).

**개발 환경 (`__DEV__ === true`)**
- 기본값: iOS 시뮬레이터 `http://localhost:8080`, Android 에뮬레이터 `http://10.0.2.2:8080`
- 실기기 테스트: `.env`에 `EXPO_PUBLIC_DEV_API_HOST=<백엔드 PC LAN IP>` 또는 `EXPO_PUBLIC_API_BASE_URL=http://<백엔드 PC LAN IP>:8080` 설정
- 포트만 바꾸려면 `EXPO_PUBLIC_DEV_API_PORT`
- 자세한 설정 방법은 `docs/development-api.md` 참고

**운영 환경 (`__DEV__ === false`)**
- 기본값 없음. `EXPO_PUBLIC_PROD_API_BASE_URL` 환경변수로 반드시 지정해야 한다 (미설정 시 모든 API 호출 실패).
- HTTPS 도메인 구성이 완료되면 `utils/api.js`의 `DEFAULT_PROD_BASE_URL`에 기본값을 채워 넣는다.

요청 타임아웃은 15초 (`REQUEST_TIMEOUT_MS`).

### 이미지 URL 조합
백엔드에서 받은 `photoUrl`은 상대경로(`/uploads/...`)다. 항상 `BASE_URL`과 조합해서 사용한다.

```js
import { api, BASE_URL } from '../utils/api';

// 이미지 렌더링
<Image source={{ uri: `${BASE_URL}${item.photoUrl}` }} />

// 절대경로인 경우도 있으므로 분기 처리
uri: photoUrl.startsWith('/') ? `${BASE_URL}${photoUrl}` : photoUrl
```

### 아바타 시스템
아바타 ID는 `'01'`~`'06'` 문자열. `utils/avatars.js`에서 가져온다.

```jsx
import { getAvatarSource, getAvatarDefaultSource, AVATAR_IDS } from '../utils/avatars';

// 실제 화면용 — 미션 상태에 따라 아바타 이미지가 바뀜
const avatarSource = getAvatarSource(avatarId, currentMission?.status);
// status: null | 'active' | 'pending' | 'done' | 'verified'

// 피커/편집 화면용 — 항상 default 이미지
const avatarSource = getAvatarDefaultSource(avatarId);

// SVG 렌더링 (ProfileScreen, SignupScreen 참고)
function AvatarSvg({ source: SvgComponent, width = 80, height = 80 }) {
  if (!SvgComponent) return <View style={{ width, height }} />;
  return <SvgComponent width={width} height={height} />;
}
```

`AvatarSvg`는 현재 `ProfileScreen`·`SignupScreen`에 중복 정의됨 → 추후 `components/`로 이전 예정.

### 미션 상태값
```
status: 'active'   — 미션 배정됨, 아직 인증 안 함
        'pending'  — 사진 업로드 완료, 피어 인증 대기 중
        'verified' — 피어 인증 완료
```

### 그린 버튼 패턴
주요 액션 버튼은 `LinearGradient`로 고정값 사용한다.

```jsx
import { LinearGradient } from 'expo-linear-gradient';

// 활성 버튼
<LinearGradient colors={['#26d67a', '#1ab065']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
  <T v="btn">확인</T>
</LinearGradient>

// 비활성 버튼
<LinearGradient colors={[C.surface2, C.surface2]} style={s.btn}>
  <T v="btn" style={{ color: C.textSub }}>확인</T>
</LinearGradient>
```

### 햅틱 피드백
버튼 동작에는 `utils/haptics.js`를 사용한다.

```js
import * as H from '../utils/haptics';

H.tap()      // 일반 버튼
H.success()  // 완료 액션 (저장, 인증 등)
```

### 푸시 알림
`utils/notifications.js`로 매일 반복되는 로컬 알림을 등록한다. 두 종류뿐이며, 각 `schedule*Notification()`은 내부에서 동일 identifier의 기존 예약을 `cancel*Notification()`으로 먼저 취소한 뒤 재등록한다. 그래서 같은 함수를 다시 호출해도 중복 없이 새 값으로 갱신된다.

```js
import {
  scheduleMissionNotification,
  cancelMissionNotification,
  scheduleReminderNotification,
} from '../utils/notifications';

// 미션 알림 — 사용자가 설정한 시간에 매일 발송
await scheduleMissionNotification(hour, minute);

// 리마인더 알림 — 매일 21:00 고정 반복 (미션 완료 여부와 무관하게 발송)
await scheduleReminderNotification();

// 로그아웃 시 미션 알림 취소
await cancelMissionNotification();
```

- `scheduleReminderNotification()`은 매일 21:00에 무조건 발송한다. "미션 미완료자만 보기" 같은 조건 분기는 호출부에서 알림 등록 자체를 막거나 별도 취소 호출로 제어한다 (코드 안에 조건 로직 없음).
- 권한은 `requestNotificationPermission()`이 내부에서 자동 요청한다. 거부되면 `schedule*Notification()`은 silent return해서 알림이 등록되지 않는다.
- 권한 거부 시 사용자에게 알림 권한이 필요하다는 UX(Alert, 설정 이동 등)를 보여줘야 하면 호출부에서 미리 `requestNotificationPermission()`을 호출해 결과로 분기한다 (예: `SettingsScreen`의 푸시/리마인더 토글).
- Android는 `offmode-silent-notifications` 채널을 자동 생성. **새 알림 추가 시 채널을 따로 만들면 사운드 정책이 달라지므로 같은 채널을 재사용한다.**
- 현재 모든 알림은 `shouldPlaySound: false`. 효과음 정식 도입 시 `notifications.js`의 TODO 두 곳을 동시에 `true`로 바꾼다.

### 폰트
전용 폰트 `Kkukkukk` 하나만 사용. `T` 컴포넌트가 자동 적용하므로 직접 지정 불필요.

---

## 백엔드 규칙

### 패키지 구조
DDD 풍으로 `global/`(공통 인프라)과 `boundedcontext/`(도메인) 두 갈래로 나뉜다.
```
com.offmode/
  global/
    config/     # SecurityConfig, FileConfig, S3Config
    dto/        # ApiResponse 등 공통 응답 래퍼
    exception/  # BusinessException, GlobalExceptionHandler
    file/       # ImageUploadService (R2 / 로컬 fallback)
    health/     # HealthController
    jwt/        # JwtProvider, JwtAuthFilter
    status/     # ErrorStatus enum
  boundedcontext/
    auth/       # 카카오·애플 로그인, JWT 발급
    user/       # 유저 프로필, 통계
    mission/    # 미션 풀, 오늘의 미션, UserMission
    feed/       # 인증(Verification), 피어확인(Confirm), 리액션, 피드
    badge/      # 뱃지 정의(enum), 유저 뱃지
```
각 boundedcontext 모듈 안은 보통 `api/v1/`(컨트롤러), `service/`, `entity/`, `repository/`, `dto/` 하위 구조를 따른다.

### 환경 분리
- `dev` 프로파일: H2 파일 DB (`offmode-db.mv.db`), R2 없이 로컬 파일 저장
- `prod` 프로파일: MySQL (Railway), Cloudflare R2

### S3Client (Cloudflare R2)
`S3Config`에서 `Optional<S3Client>` 빈으로 등록.
`r2.access-key`가 비어 있으면 `Optional.empty()` 반환 → dev 환경에서 자동으로 로컬 저장 fallback.
`FeedService`에서 `Optional<S3Client>`로 주입받아 `.isPresent()`로 분기.

### Lombok
`@RequiredArgsConstructor` + `final` 필드로 생성자 주입 사용.
`@Getter`, `@Builder`, `@Slf4j` 활용.

### 응답 규칙
성공 응답과 에러 응답이 포맷이 다르다.

**성공**: 컨트롤러는 `ResponseEntity<DTO>`로 DTO를 그대로 반환한다.
- 일반 케이스 → `ResponseEntity.ok(dto)` (200, DTO 본문)
- 데이터 없음 → `ResponseEntity.noContent().build()` (204, 본문 없음 — 예: 오늘 미션이 아직 없을 때)
- 목록이 비어 있을 때는 204가 아니라 빈 배열 `[]`을 담은 200을 반환한다.

**에러**: `GlobalExceptionHandler`가 던져진 예외를 잡아 `ApiResponse<?>` 포맷으로 변환한다.
```json
{ "isSuccess": false, "code": "MISSION_404_001", "message": "해당 미션을 찾을 수 없습니다." }
```
- 필드 순서는 `isSuccess → code → message → result` (`@JsonPropertyOrder` 적용)
- `result`는 `null`이면 직렬화 생략 (`@JsonInclude(NON_NULL)`)
- 프론트 `utils/api.js`는 비 2xx 응답에서 `data?.message`를 읽어 `Error.message`로 던진다 — 그래서 사용자에게 보일 메시지는 반드시 한국어로 작성한다.

### 에러 처리 패턴
도메인 에러는 `ErrorStatus` enum에 등록한 뒤 `BusinessException`으로 던진다. `GlobalExceptionHandler`가 자동으로 `ApiResponse`로 변환한다.

```java
// 1) ErrorStatus enum에 케이스 추가 (global/status/ErrorStatus.java)
MISSION_NOT_FOUND(HttpStatus.NOT_FOUND, "MISSION_404_001", "해당 미션을 찾을 수 없습니다."),

// 2) 서비스에서 throw
throw new BusinessException(ErrorStatus.MISSION_NOT_FOUND);
```

`ResponseStatusException`이나 임의 4xx를 직접 만들지 않는다. 새 에러 케이스는 반드시 `ErrorStatus`에 먼저 등록한다.

---

## 미션 카테고리
| 카테고리 | 색상 | 의미 |
|---|---|---|
| Vitality | green | 활동, 산책, 운동 |
| Energy | blue | 자기관리, 뷰티, 루틴 |
| Intellect | purple | 소비, 탐험, 발견 |

---

## 주요 플로우
1. 앱 시작 → 토큰 복원 → `/api/v1/users/me` 자동 로그인
2. 설정한 시간 도달 → 미션 룰렛 자동 표시
3. 룰렛에서 미션 선택 → `/api/v1/missions/today` POST
4. 미션 완료 → 사진 촬영 → `/api/v1/feed/verify` POST (multipart)
5. 피드에서 다른 유저 인증 확인 → 리액션 or 피어 인증

---

## 코드 수정 시 주의사항
- 텍스트 추가 시 `<T>` 컴포넌트 사용, `<Text>` 직접 사용 금지
- 색상 추가 시 `constants/colors.js`의 dark/light 양쪽에 모두 추가
- 새 API 엔드포인트 추가 시 `SecurityConfig`의 permitAll/authenticated 목록 확인
- 백엔드 엔티티 변경 시 dev/prod 모두 `ddl-auto: validate`이므로 자동 반영되지 않는다. `backend/src/main/resources/db/migration/{h2,mysql}/V*__*.sql`에 Flyway 마이그레이션을 동시에 추가한다 (H2/MySQL 양쪽 모두)
- 개발 API 주소는 `.env`의 `EXPO_PUBLIC_*` 변수로 설정하고 `utils/api.js`에 로컬 IP를 하드코딩하지 않음
- `AvatarSvg` 컴포넌트가 `ProfileScreen`·`SignupScreen`에 중복 정의됨 → `components/AvatarSvg.jsx`로 분리 예정
- `BADGE_IMAGE_MAP`이 `MissionScreen`·`ProfileScreen`에 중복 정의됨 → `constants/badges.js`로 분리 예정
