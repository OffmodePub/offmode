---
name: verify
description: 코드 변경이 실제로 동작하는지 백엔드를 띄워 end-to-end 로 확인한다. 백엔드 변경이면 bootRun + health + 변경 API 스모크, 프론트 변경이면 lint + 실기기 확인 안내. "동작 확인해줘", "실제로 되는지 확인", /verify 호출, 또는 커밋 전 논트리비얼 변경 검증 시 동작.
---

# offmode 변경 검증 (/verify)

lint/test 통과만으로 "동작한다"고 선언하지 않는다. 변경이 닿는 흐름을 실제로 굴려서 관찰한다.

## 백엔드 변경 검증

### 1. 백엔드 기동 (이미 떠 있으면 재사용)

```bash
curl -fsS -m 2 http://localhost:8080/api/v1/health && echo "이미 기동 중" \
  || ( cd backend && ./gradlew bootRun )   # run_in_background 로 실행
```
- 기본 프로파일은 dev (H2 파일 DB `offmode-db.mv.db`, 이미지 로컬 `./uploads` fallback) — 별도 인프라 불필요.
- 기동 대기: health 가 200 될 때까지 폴링 (최대 ~90초, Gradle 첫 빌드 포함).
- **기동 실패 시 최우선 의심: Flyway validate 실패** (엔티티 변경 + 마이그레이션 누락/불일치). 로그에서
  `FlywayValidateException` 을 확인하고 /migration 으로 h2/mysql 양쪽 마이그레이션을 맞춘다.

### 2. 기본 스모크

```bash
curl -fsS http://localhost:8080/api/v1/health                          # 200 기대
curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/api/v1/users/me   # 401 기대 (인증 필터 동작 확인)
```

### 3. 변경 API 직접 호출

이번 변경이 닿는 엔드포인트를 실제 호출로 관찰한다. 인증이 필요한 API 는:
- dev DB(H2)에 기존 유저가 있으면 해당 유저로 JWT 를 만들 수 없으므로, **테스트 코드(@SpringBootTest / MockMvc)로 검증하는 편이 빠른 경우 그쪽을 택한다** (.claude/rules/backend-testing.md).
- permitAll 엔드포인트(SecurityConfig `getPublicEndpoints()`)는 curl 로 직접 관찰한다.
- 에러 응답이 `{ isSuccess, code, message }` 포맷·한국어 메시지인지도 함께 확인한다.

### 4. 정리

이 검증을 위해 직접 띄운 백엔드는 종료한다: `pkill -f "OffmodeApplication"`.
원래 떠 있던 백엔드는 건드리지 않는다.

## 프론트 변경 검증

- `npm run lint` 통과 확인까지가 Claude 의 책임.
- **실기기/시뮬레이터 UX 동작 확인은 사용자 몫** — 확인해 달라고 요청하고, 아래 실행 조건을 함께 안내한다:
  - expo-dev-client 라 `npm run ios` 필요 (`expo start` 단독으로는 Safari 에러)
  - 백엔드 8080 기동 필수
  - 실기기는 `.env` 에 `EXPO_PUBLIC_DEV_API_HOST=Mac.local`, 시뮬레이터는 `.env` 비움
- 화면 로직 중 순수 JS 로 분리 가능한 부분(날짜 계산, 상태 분기 등)은 `node -e` 로 직접 굴려 확인할 수 있다.

## 완료 기준

- 백엔드: health 200 + 변경 API 실제 응답 관찰 (또는 동등한 통합 테스트 통과)
- 프론트: lint 통과 + 사용자 실기기 확인 요청 완료
- 관찰한 실제 응답/로그를 근거로 보고한다. 실패하면 실패했다고 출력과 함께 보고한다.
