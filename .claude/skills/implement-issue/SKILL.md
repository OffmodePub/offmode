---
name: implement-issue
description: GitHub 이슈(또는 붙여넣은 PR/이슈 본문)를 받아 offmode 컨벤션대로 기능을 구현하고 빌드 검증·커밋 메시지 제안까지 처리한다. "이슈 #N 구현해줘", "#N 구현", "이 PR 내용대로 만들어줘", 이슈/PR 본문 붙여넣기, 또는 /implement-issue 호출 시 동작.
---

# implement-issue — 이슈→코드 구현 워크플로 (offmode)

GitHub 이슈를 받아 offmode 코드를 구현한다. 백엔드는 Spring Boot 3.5/Java 21 단일 모듈, 프론트는 RN/Expo(JSX).
**커밋·푸시는 절대 직접 하지 않는다**(사용자가 직접). 핵심 원칙: **새 패턴을 발명하지 말고 기존 슬라이스를 복제 기준으로 삼는다.**

> 큰 작업은 도메인 서브에이전트에 위임 가능: 백엔드 → `backend-expert`, 프론트 → `frontend-expert`. 메인 컨텍스트를 아끼려면 적극 활용.

## 1. 이슈 식별 & 컨텍스트 수집

- 번호 명시 → `gh issue view {N}`. 본문 붙여넣었으면 그대로. 둘 다 없으면 무엇을 구현할지 물어본다.
- 파악할 것: 프론트/백엔드 어느 쪽인지(또는 둘 다), 대상 도메인, 엔드포인트(메서드/경로)·요청·응답 필드, 인증 필요 여부, 엔티티/스키마 변경 여부.
- **다른 영역까지 손대야 할 것 같으면 임의로 확장하지 말고 사용자에게 공유**한다.

## 2. 리싱크 — 작성 전 기존 코드 다시 읽기

새 코드를 쓰기 전 반드시 develop 최신 기준으로 관련 코드를 읽는다.

- **백엔드**: 공통 인프라(`global/dto/response/ApiResponse`, `global/status/ErrorStatus`, `global/exception/BusinessException`+`GlobalExceptionHandler`, 인증 시 `global/jwt`) + **같은/유사 도메인의 기존 슬라이스 1개**를 템플릿으로 Read (예: `boundedcontext/mission/{api/v1/MissionController, service/MissionService, entity, repository, dto}`).
- **프론트**: 유사 화면/컴포넌트 1개 + `utils/api.js`, `components/ThemedText.js`, `utils/ThemeContext.js`, 필요한 유틸(`avatars/haptics/notifications`).

## 3. 구현 계획 제시 → 사용자 확인

생성/수정 파일을 계층별로 목록화해 보여주고 확인받는다. **임의 일괄 진행 금지.** 예:
```
### 구현 계획 — #N {제목}
[백엔드]
신규: boundedcontext/<domain>/dto/request/XxxRequest.java, dto/response/XxxResponse.java,
      api/v1/XxxController.java(또는 기존에 메서드 추가), service/...
수정: global/status/ErrorStatus.java (신규 에러코드 N개), db/migration/{h2,mysql}/V{n}__*.sql
테스트: XxxControllerTest, XxxServiceTest
[프론트]
신규/수정: screens/..., utils/api 호출부 ...
```

## 4. 백엔드 구현 규칙 (Controller→Service→Repository 3계층)

offmode에는 **Facade/UseCase/Mapper/MapStruct/Swagger/Kafka 가 없다.** 기존 슬라이스를 그대로 복제한다.

- **Controller** (`api/v1/`): `@RestController @RequestMapping("/api/v1/...") @RequiredArgsConstructor`. 성공은 `ResponseEntity<DTO>` 직접 반환(`ok`/`noContent`(204)/빈목록은 `[]`+200). 인증은 `@AuthenticationPrincipal Long userId`. `@Valid @RequestBody`.
- **Service**: `@Slf4j @Service @RequiredArgsConstructor`+`final`. 쓰기엔 `@Transactional`. 검증 실패는 `throw new BusinessException(ErrorStatus.XXX)`.
- **Entity**: `@Entity @Table @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder`, `@GeneratedValue(IDENTITY)`, 연관 `@ManyToOne(LAZY)`+`@JsonIgnore`, enum은 AttributeConverter.
- **Repository**: `JpaRepository<E,Long>` + 파생쿼리/JPQL projection.
- **DTO**: Request=클래스+`@Getter`+Validation, Response=`record`.
- **에러**: `ErrorStatus` enum에 `DOMAIN_REASON` 상수 + `DOMAIN_HTTP_SEQ` code(예 `MISSION_404_001`) + **한국어 메시지** 추가(prefix: COMMON/VALID/AUTH/USER/MISSION/VERIFICATION/PART/FILE, 번호 최대+1). `ApiResponse`는 에러 전용이라 성공엔 안 쓴다.
- **보안**: 새 엔드포인트는 기본 authenticated. public 필요 시에만 `SecurityConfig.getPublicEndpoints()`에 추가.
- **마이그레이션**: 엔티티/스키마 변경 시 `db/migration/{h2,mysql}/V{n}__*.sql` **양쪽 동시** 추가(`ddl-auto: validate`). `/migration` 스킬 활용.
- **테스트**: Controller=`@WebMvcTest`+`@Import({SecurityConfig,JwtAuthFilter})`+`@MockitoBean`+MockMvc, Service=순수 Mockito(`@ExtendWith(MockitoExtension.class)`).

## 5. 프론트 구현 규칙

`<T>` 컴포넌트만(Text 직접 금지), 색은 토큰만, `makeStyles(C)`+`useMemo`, API는 `utils/api.js`의 `api.*`. 자세한 규칙은 `frontend-expert` 에이전트/루트 CLAUDE.md 참조.

## 6. 빌드 검증 (필수 순서)

변경 범위에 맞게. 한 단계라도 실패하면 멈추고 고친다.

**백엔드** (`backend/`):
```bash
./gradlew spotlessApply
./gradlew compileJava
./gradlew test --tests "{관련 테스트 FQN}"   # 마이그레이션 변경 시 FlywayMigrationTest 포함
```
**프론트**:
```bash
npm run lint
```
(전체 CI 재현이 필요하면 `/verify-ci` 스킬 사용.)

## 7. 보고 + 커밋 메시지 제안 (커밋·푸시 금지)

`spotlessApply`를 이미 돌린 상태에서:
```
### 구현된 파일 (N개) — #N {제목}
- `{경로}`: {짧은 설명}

### 커밋 메시지(제안)
[Feat] #N {제목}

{본문 2~3줄, why 중심}
```
라벨은 `.githooks/commit-msg` 정규식 `[Feat|Fix|Docs|Refactor|Test|Chore|Infra] #N …` 충족 필수.
**`git add`/`commit`/`push` 절대 자동 실행 금지.** PR은 사용자가 만들 때 `.github/pull_request_template.md` 형식(🔗 Issue / 📌 Summary / ✅ Test) 초안만 제시, 리뷰 반영은 `apply-pr-review` 스킬로 연계.

## 주의사항

- 커밋·푸시·force-push 자동 실행 금지. 새 패턴 발명 금지(기존 슬라이스 복제).
- 백엔드 구조는 Controller→Service→Repository 3계층뿐(Facade/UseCase/Mapper/Swagger/Kafka 없음 — 이 잔재를 만들지 말 것).
- ErrorStatus 신규 코드는 prefix·번호 규칙 준수, 메시지는 한국어, 중복 금지.
- 엔티티 변경 시 H2/MySQL 마이그레이션 **둘 다** 추가.
- 컨벤션 문서와 실제 코드가 어긋나면 실제 코드를 따른다.
