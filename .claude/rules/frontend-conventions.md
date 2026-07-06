---
paths:
  - "screens/**/*.jsx"
  - "components/**/*.jsx"
  - "components/**/*.js"
  - "utils/**/*.js"
  - "App.jsx"
---

# 프론트 공통 모듈 재사용 규칙

CLAUDE.md의 T 컴포넌트·색 토큰·makeStyles 규칙에 더해, 중복 정의 방지용 공통 모듈 안내.

## 이미 있는 공통 모듈 — 새로 정의하지 말 것

- **2자리 zero-pad**: `import { pad } from '../utils/date'` — 화면 안에 `pad`/`pad2`/인라인 padStart를 다시 만들지 않는다.
- **아바타 이미지**: `import AvatarImage from '../components/AvatarImage'` — `source` 없으면 빈 자리 유지, 기본 72. 아바타는 PNG 기반(`utils/avatars.js`의 `getAvatarSource`), SVG 방식 아님.
- **휠 피커(시간 선택 등)**: `import WheelPicker from '../components/WheelPicker'` — `colors`(surface/greenBorder/greenFaint 키)와 `renderLabel(value, selected)` prop으로 화면별 룩을 흡수한다. 룰렛 슬롯(MissionRouletteScreen)은 별개 구현.

## 인증/세션

- 인증 상태머신은 `utils/useAuth.js` 훅에 있다. 로그인 성공 후처리(프로필·미션시간·오늘미션·알림)는 App.jsx의 `applySession` **한 곳**만 수정하면 자동로그인·카카오·애플에 모두 반영된다.
- API가 토큰 보유 상태에서 401을 반환하면 `utils/api.js`의 `setOnUnauthorized` 콜백으로 자동 로그아웃된다. 화면에서 401을 개별 처리할 필요 없음 (로그인 실패 401은 예외 — 화면별 처리).
- 미션 룰렛 자동 트리거는 `utils/useMissionRouletteTrigger.js` — 정책(같은 분 재트리거 금지, hasMission이면 스킵)을 바꿀 때 이 파일만 본다.

## 로깅

- `console.*` 호출은 개발 정보성이면 `__DEV__` 가드로 감싼다. 토큰/개인정보는 프로덕션에서 절대 로그로 남기지 않는다.
