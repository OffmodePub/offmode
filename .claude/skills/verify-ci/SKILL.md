---
name: verify-ci
description: 푸시 전에 GitHub CI(ci.yml)를 로컬에서 그대로 재현해 통과 여부를 확인한다. "CI 돌려줘", "푸시 전 검증", "ci 확인", 또는 /verify-ci 호출 시 동작. 프론트 lint + 백엔드 spotlessCheck/test/build 를 한 번에 실행.
---

# verify-ci — 푸시 전 로컬 CI 재현

`.github/workflows/ci.yml`은 `develop` 대상 PR에서 (1) `frontend-lint` (2) `build` 두 잡을 돌린다.
이 스킬은 그 잡을 **로컬에서 동일 순서로 재현**해, 푸시 후 CI가 빨갛게 뜨는 일을 사전에 막는다.

## 실행 순서

변경 범위를 먼저 보고 필요한 잡만 돌려도 되지만, 기본은 전체 재현이다. 한 단계라도 실패하면 멈추고 원인을 보고한다.

### 1. 프론트 (frontend-lint 잡)
```bash
cd /Users/calla20031/offmode
npm ci          # 락파일과 어긋나면 npm install 로 대체 후 사용자에게 알림
npm run lint    # = expo lint (CI가 강제하는 유일한 프론트 검증)
```
> 프론트는 테스트 러너가 없다. lint만 통과시키면 된다. 남은 warning은 보고만.

### 2. 백엔드 (build 잡)
```bash
cd /Users/calla20031/offmode/backend
./gradlew spotlessCheck      # 포맷 검증 (CI 강제). 실패하면 ./gradlew spotlessApply 후 재검증
./gradlew test               # JUnit
./gradlew build -x test      # 빌드 산출물 검증 (테스트는 위에서 이미 돔)
```
> `spotlessCheck` 가 실패하면 **자동으로 `spotlessApply` 를 돌려 고친 뒤** 다시 `spotlessCheck` → `test` 순으로 진행하고, 포맷이 바뀐 파일을 사용자에게 알린다.

## 보고

전부 통과하면 다음만 간결히 보고한다:
```
✅ CI 로컬 통과
- frontend-lint: npm run lint OK (warning N건)
- build: spotlessCheck OK / test OK (N tests) / build OK
```
실패 시 실패한 단계 + 핵심 에러 로그 + 다음 액션(예: "spotlessApply 적용함, 변경파일 2개")을 보고한다.

## 주의

- `git add/commit/push` 는 자동 실행하지 않는다. 검증만 한다.
- 변경이 프론트에만 있으면 백엔드 잡은 건너뛰어도 되고(반대도 동일), 그 경우 건너뛴 이유를 보고에 적는다.
- 관련 메모리: `feedback_ci_before_push`, `feedback_spotless`.
