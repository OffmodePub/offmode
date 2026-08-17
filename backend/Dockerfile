# ── Build stage ──────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle* .
COPY src src

RUN chmod +x ./gradlew && ./gradlew bootJar -x test --no-daemon

# ── Run stage ────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /app/build/libs/*.jar app.jar

# 기준 시각을 KST로 고정한다. alpine 기본값은 UTC 라서 그대로 두면
# 한국시간 00:00~09:00 구간에 LocalDate.now() 가 '어제'를 가리킨다.
# TZ 는 로그 타임스탬프용, -Duser.timezone 은 OS tzdata 유무와 무관하게
# JDK 내장 tzdb 로 해석되므로 JVM 기본 타임존을 확정적으로 잡아준다.
ENV TZ=Asia/Seoul

# Railway가 PORT 환경변수를 주입하면 Spring이 이걸 읽음
EXPOSE 8080

ENTRYPOINT ["java", "-Duser.timezone=Asia/Seoul", "-jar", "app.jar"]
