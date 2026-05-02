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
```

**v 값 목록**: `logo`, `heading`, `title`, `section`, `body`, `sub`, `label`, `caption`, `green`, `purple`, `blue`, `green16`, `mission`, `stat`, `btn`, `ticker`

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

### API 호출
```js
import { api } from '../utils/api';

api.get('/api/...')
api.post('/api/...', body)
api.put('/api/...', body)
api.delete('/api/...')
api.upload('/api/...', formData)
```

로컬 개발 시 `utils/api.js`의 `DEV_HOST`를 현재 Mac IP로 변경해야 한다.
(`ipconfig getifaddr en0`으로 확인)

### 햅틱 피드백
버튼 동작에는 `utils/haptics.js`를 사용한다.

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
- `utils/api.js`의 `DEV_HOST`는 개발 네트워크 변경 시마다 갱신 필요 (커밋하지 않는 것 권장)
