# 백엔드 EC2 자동 배포

`main` 브랜치에 push 또는 PR merge가 발생하면 `.github/workflows/deploy-backend.yml` 워크플로가 EC2에 SSH로 접속해 백엔드 컨테이너를 재배포합니다.

## 배포 방식

1. GitHub Actions가 EC2에 SSH 접속합니다.
2. EC2의 기존 저장소에서 `main` 브랜치를 최신 상태로 갱신합니다.
3. `backend` 디렉터리에서 Docker 이미지를 EC2 내부에서 빌드합니다.
4. 기존 `offmode-backend` 컨테이너를 중지/삭제하고 새 컨테이너를 실행합니다.
5. `http://localhost:8080/api/v1/health` 헬스체크가 성공하면 배포를 완료합니다.
6. 헬스체크 실패 시 GitHub Actions 로그에 최근 컨테이너 로그를 남기고, 이전 이미지가 있으면 이전 이미지로 컨테이너를 다시 실행합니다.

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

## EC2 사전 준비

EC2에는 Docker, Git, curl이 설치되어 있어야 하며 `ec2-user`가 Docker 명령을 실행할 수 있어야 합니다.

```bash
cd /home/ec2-user
git clone git@github.com:OffmodePub/offmode.git
cd offmode
git switch main
```

운영 환경변수는 EC2 안의 `backend/.env`에 둡니다. 이 파일은 저장소에 커밋하지 않습니다.

```bash
cd /home/ec2-user/offmode/backend
cp .env.example .env
vi .env
```

필수 값:

- `SPRING_PROFILES_ACTIVE=prod`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`
- `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_ENDPOINT`, `R2_BUCKET`, `R2_PUBLIC_URL`
- `JWT_SECRET`
- `CORS_ALLOWED_ORIGINS`

## 수동 검증

자동 배포 전 EC2에서 한 번 수동으로 검증합니다.

```bash
cd /home/ec2-user/offmode/backend
docker build -t offmode-backend:manual .
docker run -d --name offmode-backend --env-file .env -p 8080:8080 offmode-backend:manual
curl -fsS http://localhost:8080/api/v1/health
docker logs --tail=100 offmode-backend
```

## Flyway 배포 주의사항

`prod` 프로필은 Flyway를 사용하고 Hibernate `ddl-auto`는 `validate`입니다. 스키마 변경이 포함된 배포 전에는 RDS 스냅샷 또는 백업을 먼저 생성하고, `backend/src/main/resources/db/migration/mysql`의 새 마이그레이션이 운영 DB에 적용 가능한지 확인합니다.

운영 DB에 Flyway를 처음 적용하는 경우에는 기존 스키마와 `V1__init_schema.sql`을 비교한 뒤 baseline 전략을 먼저 정합니다. 자세한 정책은 `docs/db-migration.md`를 참고합니다.
