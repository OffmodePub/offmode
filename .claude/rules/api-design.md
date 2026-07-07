---
paths:
  - "backend/src/main/**/*.java"
---

# 백엔드 API 설계 규칙

CLAUDE.md의 응답/에러 규칙에 더해, 코드 리뷰에서 반복 지적된 항목을 규칙화한 것.

## 응답 (요약)

- 성공: `ResponseEntity<DTO>` 직접 반환. 단건 없음 → 204, **빈 목록 → `[]` 200 (204 금지)**.
- 에러: `ErrorStatus` enum 등록 → `BusinessException` throw. `ResponseStatusException`·임의 RuntimeException 금지.
- 사용자 노출 메시지는 반드시 한국어 (프론트가 `data?.message`를 그대로 표시).

## 동시성 — check-then-act 금지 패턴

- **count/exists 조회 후 상태 전환·부수효과(레벨업, 뱃지, VERIFIED 전환)를 하는 쓰기 경로는 반드시 대상 행을 `@Lock(LockModeType.PESSIMISTIC_WRITE)` 조회로 직렬화한다.** 패턴: 리포지토리에 `findWithLockById` (`@Lock` + 명시 `@Query`) 추가, 쓰기 경로에서만 사용하고 읽기 경로에는 락을 섞지 않는다.
  - 예: `VerificationRepository.findWithLockById`, `RoomProofRepository.findWithLockById` (confirm·리액션 토글에서 사용)
- find-then-save 토글(리액션류)도 같은 락으로 감싼다 — UNIQUE 제약 위반 500 방지.
- 그래도 새는 경합은 `GlobalExceptionHandler`의 `DataIntegrityViolationException` → 409 `COMMON_409` 방어선이 받는다. 이 핸들러가 있다고 락을 생략하지 않는다 (409는 마지막 방어선일 뿐, 부수효과 이중 실행은 락만 막는다).
- `@Transactional(readOnly = true)` 트랜잭션에서 FOR UPDATE 금지.

## N+1 — 루프 안 리포지토리 호출 금지

- 컬렉션을 돌면서 건마다 `findBy...`/`countBy...`를 호출하지 않는다. id 리스트를 모아 **IN 배치 조회 + 애플리케이션 집계**로 바꾼다.
  - 집계: `SELECT x.id, COUNT(x) ... WHERE x.id IN :ids GROUP BY x.id` → `Map<Long, Long>` 변환 (예: `RoomService.toCountMap`)
  - 연관 로드: `JOIN FETCH` (예: `RoomMemberRepository.findWithUserByRoomIdOrderByJoinedAtAsc`, `RoomProofRepository.findWithUserByRoomMissionId`)
- 응답 조립기(Assembler)도 단건 메서드를 루프로 부르지 말고 배치 메서드(`buildAll`)로 만들고 단건은 `buildAll(List.of(x))`로 위임한다 (예: `RoomProofAssembler`).
- 모범 사례: `FeedService.getFeed`의 `findRowsByVerificationIdIn` 배치 집계.

## 스키마

- 엔티티 변경 시 Flyway 마이그레이션을 `db/migration/h2/`와 `db/migration/mysql/` **양쪽에 같은 버전 번호로** 동시 추가 (`/migration` 스킬 사용). `ddl-auto: validate`라 누락 시 부팅 실패.
- 새 엔드포인트 추가 시 `SecurityConfig` permitAll/authenticated 목록 확인.
