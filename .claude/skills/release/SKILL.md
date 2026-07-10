---
name: release
description: offmode prod 배포 절차 전체(배포 PR → lightweight 태그 push → 모니터링 → 검증)를 함정 체크리스트와 함께 진행한다. "배포해줘", "릴리즈 진행", "vX.Y.Z 배포", 또는 /release 호출 시 동작. main 머지만으로는 배포되지 않고 v*.*.* 태그 push가 트리거라는 점과, 과거 배포에서 실제로 겪은 함정 5종의 예방·수습법을 포함한다.
---

# offmode prod 배포 (/release)

prod 배포는 **develop → main 배포 PR 머지 후 `v{M}.{m}.{p}` 태그를 push**해야
`.github/workflows/deploy-backend.yml`(EC2 Docker 재빌드 + health check + 실패 시 자동 롤백)이 실행된다.
**머지만으로는 배포되지 않는다 — 태그 push가 트리거다.**

## 0. 사전 확인

1. 버전 결정 — 현재 태그 확인 후 정책에 따라:
   ```bash
   git ls-remote --tags origin
   ```
   - patch (`v0.4.x`): 버그 수정, 운영 데이터 정리, 소규모 개선
   - minor (`v0.x.0`): 새 도메인 기능, 아키텍처 변경
   - major (`v1.0.0`): 정식 오픈
2. develop CI 초록 확인: `gh run list --branch develop --limit 3`
3. 릴리즈 diff에 Flyway 마이그레이션 포함 여부:
   ```bash
   git fetch origin && git diff --name-only origin/main...origin/develop -- 'backend/src/main/resources/db/migration/**'
   ```
   포함돼 있으면 **아래 "함정 1" 사전 검증 필수** + RDS 스냅샷 권장 (docs/backend-ec2-deploy.md).

## 1. [함정 1] MySQL 마이그레이션은 로컬 MySQL 도커로 사전 검증 필수

H2는 통과해도 MySQL만 실패하는 경우가 있다 (v0.2.0 배포에서 V8이 prod에서만 실패 — H2는 FK가
요구하는 인덱스 삭제를 허용하지만 MySQL은 거부, errno 1553).

```bash
docker run --rm -d --name offmode-mig-test -e MYSQL_ROOT_PASSWORD=test -e MYSQL_DATABASE=offmode -p 3307:3306 mysql:8.0
# 기동 대기 후 V1 → VN 순서대로 전부 실행
for f in backend/src/main/resources/db/migration/mysql/V*.sql; do
  echo "== $f"; docker exec -i offmode-mig-test mysql -uroot -ptest offmode < "$f" || break
done
docker rm -f offmode-mig-test
```
정렬 주의: 셸 glob은 V10이 V2보다 먼저 오므로 버전 숫자 기준으로 순서를 확인하고 실행한다.

## 2. 배포 PR (develop → main)

- 제목: `[Infra] #84 v{M}.{m}.{p} 배포` — **정확히 이 형식** (pr-title.yml 검사)
- 본문: `Ref #84` — ❗ `close #84` 금지 (#84는 트래킹용 영속 이슈, 닫히면 안 됨)
- 예시: PR #83 (v0.1.0)
- 머지 후 main CI 통과 확인.

## 3. [함정 2] 태그는 반드시 lightweight로 생성

`git tag -a`(annotated)로 만들면 러너의 "Validate tag is included in main" 스텝이
"would clobber existing tag"로 실패한다 (annotated 태그 객체 sha ≠ 커밋 sha).

```bash
git fetch origin main
git tag vX.Y.Z origin/main        # -a 없이! lightweight
git push origin vX.Y.Z            # ← 이 push 가 배포 트리거
```

잘못 annotated 로 만들었으면:
```bash
git push origin :refs/tags/vX.Y.Z && git tag -d vX.Y.Z && git tag vX.Y.Z origin/main && git push origin vX.Y.Z
```

## 4. 모니터링

```bash
gh run watch --exit-status $(gh run list --workflow deploy-backend.yml --limit 1 --json databaseId -q '.[0].databaseId')
```

### 실패 시 수습

- **[함정 3] "would clobber existing tag"** — 태그 재지정(retag) 시 EC2 로컬 저장소의 낡은 태그가
  fetch를 깨뜨린 것. EC2에서 `git tag -d vX.Y.Z` 후 워크플로 재실행. (근본 해결은 워크플로 fetch에
  `--force` 추가 — 미적용이면 제안할 것.)
- **[함정 4] "untracked working tree files would be overwritten by checkout"** — EC2에 scp 등으로
  직접 올린 파일이 이번 태그에서 tracked가 되며 충돌한 것. EC2에서 해당 경로 `rm -rf` 후
  `gh run rerun <run-id> --failed`. 교훈: EC2에 파일을 직접 올리지 말고 커밋 → 배포로 반영.
- **[함정 5] 마이그레이션 부분 실패** — MySQL DDL은 트랜잭션이 아니라 절반 적용된 채 남고,
  `flyway_schema_history`에 `success=0` 행이 생겨 다음 기동 validate가 실패한다. 수습:
  1. EC2에서 RDS 접속 (접속법: docs/backend-ec2-deploy.md)
  2. 적용된 DDL을 수동으로 되돌린다
  3. `DELETE FROM flyway_schema_history WHERE success = 0;`
  4. 마이그레이션 수정 후 재배포

## 5. 배포 후 검증 (여기까지가 완료)

```bash
curl -fsS https://api.offmodechallenge.com/api/v1/health
```
+ 이번 릴리즈에서 바뀐 동작을 실제로 수동 확인한다 (health 통과만으로 완료 선언 금지).
확인이 끝나면 배포 내용을 #84 이슈에 코멘트로 남길지 사용자에게 물어본다.
