# DB 마이그레이션

OffMode 백엔드는 Flyway를 이용해 데이터베이스 스키마를 관리합니다.

---

## 정책

* 서버 환경(dev, prod 등)에서는 Hibernate의 `ddl-auto: update` 옵션을 사용하지 않습니다.
* `dev`와 `prod` 환경 모두 `spring.jpa.hibernate.ddl-auto=validate`로 설정해야 합니다.
* 스키마를 변경하거나 초기(Seed) 데이터를 추가할 때는 반드시 Flyway 마이그레이션 버전 파일로 관리해야 합니다.
* `data.sql`은 사용하지 않습니다. 초기 미션 데이터는 `V2__seed_missions.sql` 스크립트로 셋업합니다.

---

## 파일 위치

H2와 MySQL은 ID(식별자) 생성 방식과 Upsert 문법이 다릅니다. 따라서 프로젝트 내에서 DB별로 마이그레이션 디렉터리를 분리하여 관리하고 있습니다.

* `backend/src/main/resources/db/migration/h2`
* `backend/src/main/resources/db/migration/mysql`

**현재 적용된 마이그레이션:**

* `V1__init_schema.sql`: 현재 JPA 엔티티를 기준으로 작성된 초기 스키마
* `V2__seed_missions.sql`: 초기 미션 데이터

> **참고** : 여기서 V 뒤에 붙은 숫자는 마이그레이션 적용 순서입니다.
> 숫자 순서대로 적용하면 됩니다.

---

## 마이그레이션 추가 방법

1. H2와 MySQL 마이그레이션 폴더 양쪽에 각각 다음 버전의 SQL 파일을 생성합니다.
2. 두 DB 모두 **버전과 파일명(설명)을 똑같이** 맞춰야 합니다.
3. Java 21 환경에서 백엔드 테스트를 돌려 정상 작동하는지 확인합니다.

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
.\gradlew.bat clean build
```

혹은

```bash
# 1. JAVA_HOME 설정 (macOS에 설치된 Java 21 버전을 자동으로 찾아서 할당)
export JAVA_HOME=$(/usr/libexec/java_home -v 21)

# 2. PATH 환경 변수 업데이트
export PATH="$JAVA_HOME/bin:$PATH"

# 3. Gradle 빌드 실행 (macOS에서는 .bat 대신 확장자 없는 스크립트 사용)
./gradlew clean build
```

---

## dev 로컬 DB 전환 절차

`dev` 프로필은 파일 기반 H2 DB(`jdbc:h2:file:./offmode-db`)를 사용합니다. 기존에 `ddl-auto: update`로 생성된 로컬 DB 파일이 남아 있고 Flyway 이력 테이블이 없으면, Flyway가 `V1__init_schema.sql`을 적용할 때 이미 존재하는 테이블 때문에 실패할 수 있습니다.

Flyway 전환 후 처음 실행하기 전에 로컬 개발 DB를 초기화하세요.

```powershell
# 프로젝트 루트 또는 backend 실행 위치에 생성된 H2 파일을 삭제
Remove-Item .\offmode-db.mv.db -ErrorAction SilentlyContinue
Remove-Item .\offmode-db.trace.db -ErrorAction SilentlyContinue
Remove-Item .\backend\offmode-db.mv.db -ErrorAction SilentlyContinue
Remove-Item .\backend\offmode-db.trace.db -ErrorAction SilentlyContinue
```

로컬 데이터를 보존해야 한다면 삭제하지 말고 백업한 뒤, 현재 스키마와 `V1__init_schema.sql`을 비교해서 dev 전용 baseline 전략을 잡아야 합니다. 단, 운영 환경에서는 임의로 baseline을 켜지 말고 백업/검증 절차를 먼저 진행해야 합니다.

---

## 프로덕션(운영) 배포

운영 환경에 마이그레이션을 반영하기 전, 다음 사항을 확인하고 진행하세요.

1. 운영 데이터베이스를 **백업**합니다.
2. 애플리케이션 프로필이 `SPRING_PROFILES_ACTIVE=prod`로 제대로 설정되어 있는지 확인합니다.
3. 운영 DB 접속 정보(Credentials)가 타겟 데이터베이스를 정확히 바라보는지 확인합니다.
4. 배포를 한 번 실행한 뒤, Flyway가 `flyway_schema_history` 테이블을 정상적으로 생성하거나 업데이트했는지 체크합니다.
5. Hibernate의 `validate` 검증 상태에서 애플리케이션이 무사히 구동되는지 확인합니다.

> **주의:** 이미 운영 중인 데이터베이스에 처음 플라이웨이를 도입하는 경우, `V1__init_schema.sql` (초기 스키마 파일)을 그대로 실행하면 안 됩니다.
> 기존 스키마와 V1 스크립트를 비교한 뒤, 백업을 진행하고 Flyway를 활성화하기 전에 베이스라인(Baseline) 기준점을 먼저 잡아주세요.

---

## 롤백

Flyway 무료(Community) 버전은 SQL 마이그레이션 자동 롤백을 지원하지 않습니다. 따라서 문제 발생 시 다음 중 한 가지 방법으로 직접 처리해야 합니다.

* 치명적인 오류 발생 시 **DB 백업본을 복원**하여 롤백
* 잘못된 변경 사항을 원상 복구하는 새로운 마이그레이션 파일(순방향 롤백 스크립트)을 추가로 작성하여 배포

운영 환경에 변경 사항을 배포할 때는 만약의 사태를 대비해 사전에 롤백용 SQL 스크립트나 백업/복원 계획을 반드시 세워두시기 바랍니다.
