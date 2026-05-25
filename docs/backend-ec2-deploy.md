# 백엔드 EC2 자동 배포

`main` 브랜치에 PR을 머지한 뒤 `main`에 포함된 커밋에 `v1.0.0` 같은 버전 태그를 push하면 `.github/workflows/deploy-backend.yml` 워크플로가 EC2에 SSH로 접속해 백엔드 컨테이너를 재배포합니다.

## 배포 방식

1. GitHub Actions가 EC2에 SSH 접속합니다.
2. GitHub Actions와 EC2에서 배포 대상 태그가 `origin/main`에 포함된 커밋인지 확인합니다.
3. EC2의 기존 저장소에서 Git 태그를 갱신한 뒤 배포 대상 버전 태그 커밋을 checkout합니다.
4. `backend` 디렉터리에서 Docker 이미지를 EC2 내부에서 `offmode-backend:v1.0.0` 형식으로 빌드합니다.
5. 기존 `offmode` 컨테이너를 중지/삭제하고 새 컨테이너를 실행합니다.
6. `http://localhost:8080/api/v1/health` 헬스체크가 성공하면 배포를 완료합니다.
7. 헬스체크 실패 시 GitHub Actions 로그에 최근 컨테이너 로그를 남기고, 이전 이미지가 있으면 이전 이미지로 컨테이너를 다시 실행합니다.

## 배포 실행

`develop`에서 검증된 변경사항을 `main`으로 머지한 뒤 버전 태그를 생성해 push합니다.

```bash
git switch main
git pull origin main
git tag v1.0.0
git push origin v1.0.0
```

태그 이름은 `v*.*.*` 패턴이어야 자동 배포가 실행됩니다. 예: `v1.0.0`, `v1.0.1`, `v1.1.0`

태그가 `main`에 포함되지 않은 커밋을 가리키면 워크플로가 배포 전에 실패합니다.

## GitHub 설정

Repository Secrets:

| 이름 | 설명 |
| --- | --- |
| `EC2_HOST` | EC2 public IP 또는 도메인 |
| `EC2_SSH_KEY` | `ec2-user`로 접속 가능한 private key 전문 |
| `EC2_USER` | 선택값. 생략 시 `ec2-user` |

Repository Variables:

| 이름 | 기본값 | 설명 |
| --- | --- | --- |
| `EC2_DEPLOY_PATH` | `/home/ec2-user/offmode` | EC2 안의 offmode 저장소 경로 |
| `EC2_BACKEND_ENV_FILE` | `.env` | `backend` 디렉터리 기준 운영 환경변수 파일 경로 |

워크플로는 EC2의 현재 운영 상태에 맞춰 컨테이너 이름은 `offmode`, 이미지 이름은 `offmode-backend`를 사용합니다.

## EC2 사전 준비

운영 환경변수는 EC2 안의 `backend/.env`에 둡니다. 이 파일은 저장소에 커밋하지 않습니다.

```bash
cd /home/ec2-user/offmode/backend
vi .env
```

필수 값:

- `SPRING_PROFILES_ACTIVE=prod`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`
- `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_ENDPOINT`, `R2_BUCKET`, `R2_PUBLIC_URL`
- `JWT_SECRET`
- `CORS_ALLOWED_ORIGINS`


## Flyway 배포 주의사항

`prod` 프로필은 Flyway를 사용하고 Hibernate `ddl-auto`는 `validate`입니다. 스키마 변경이 포함된 배포 전에는 RDS 스냅샷 또는 백업을 먼저 생성하고, `backend/src/main/resources/db/migration/mysql`의 새 마이그레이션이 운영 DB에 적용 가능한지 확인합니다.

운영 DB에 Flyway를 처음 적용하는 경우에는 기존 스키마와 `V1__init_schema.sql`을 비교한 뒤 baseline 전략을 먼저 정합니다. 자세한 정책은 `docs/db-migration.md`를 참고합니다.
