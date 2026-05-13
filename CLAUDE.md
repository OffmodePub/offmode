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

### API 호출
```js
import { api } from '../utils/api';

api.get('/api/...')
api.post('/api/...', body)
api.put('/api/...', body)
api.delete('/api/...')
api.upload('/api/...', formData)
```

로컬 개발 API 주소는 `utils/api.js`를 직접 수정하지 않고 Expo 공개 환경 변수로 설정한다.

- 기본값: iOS 시뮬레이터 `http://localhost:8080`, Android 에뮬레이터 `http://10.0.2.2:8080`
- 실기기 테스트: `.env`에 `EXPO_PUBLIC_DEV_API_HOST=<백엔드 PC LAN IP>` 또는 `EXPO_PUBLIC_API_BASE_URL=http://<백엔드 PC LAN IP>:8080` 설정
- 자세한 설정 방법은 `docs/development-api.md` 참고

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

### 폰트
전용 폰트 `Kkukkukk` 하나만 사용. `T` 컴포넌트가 자동 적용하므로 직접 지정 불필요.

---

## 백엔드 규칙

### 패키지 구조
```
com.offmode/
  auth/       # 카카오·애플 로그인, JWT 발급
  user/       # 유저 프로필, 통계
  mission/    # 미션 풀, 오늘의 미션, UserMission
  feed/       # 인증(Verification), 피어확인(Confirm), 리액션, 피드
  badge/      # 뱃지 정의(enum), 유저 뱃지
  config/     # S3Config, SecurityConfig, FileConfig
  jwt/        # JwtProvider, JwtAuthFilter
```

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
- 성공 204: body 없이 반환
- 오류: `message` 필드 포함한 JSON으로 반환
- 목록이 없을 때: 빈 배열 반환 (null 금지)

---

## 미션 카테고리
| 카테고리 | 색상 | 의미 |
|---|---|---|
| Vitality | green | 활동, 산책, 운동 |
| Energy | blue | 자기관리, 뷰티, 루틴 |
| Intellect | purple | 소비, 탐험, 발견 |

---

## 주요 플로우
1. 앱 시작 → 토큰 복원 → `/api/users/me` 자동 로그인
2. 설정한 시간 도달 → 미션 룰렛 자동 표시
3. 룰렛에서 미션 선택 → `/api/missions/today` POST
4. 미션 완료 → 사진 촬영 → `/api/feed/verify` POST (multipart)
5. 피드에서 다른 유저 인증 확인 → 리액션 or 피어 인증

---

## 코드 수정 시 주의사항
- 텍스트 추가 시 `<T>` 컴포넌트 사용, `<Text>` 직접 사용 금지
- 색상 추가 시 `constants/colors.js`의 dark/light 양쪽에 모두 추가
- 새 API 엔드포인트 추가 시 `SecurityConfig`의 permitAll/authenticated 목록 확인
- 백엔드 엔티티 변경 시 dev는 `ddl-auto: update`로 자동 반영, prod는 별도 마이그레이션 필요
- 개발 API 주소는 `.env`의 `EXPO_PUBLIC_*` 변수로 설정하고 `utils/api.js`에 로컬 IP를 하드코딩하지 않음
- `AvatarSvg` 컴포넌트가 `ProfileScreen`·`SignupScreen`에 중복 정의됨 → `components/AvatarSvg.jsx`로 분리 예정
- `BADGE_IMAGE_MAP`이 `MissionScreen`·`ProfileScreen`에 중복 정의됨 → `constants/badges.js`로 분리 예정
