#!/usr/bin/env python3
"""PreToolUse(Bash): 되돌리기 어려운 위험 명령을 차단한다.

왜 이 형태인가 — 원본(languageforest)은 명령 전체를 단순 grep 하는 인라인 훅이었다.
그러면 파괴적 SQL 키워드를 **문서에 적는 것만으로도** 차단된다(2026-09-16 실제 오탐:
훅 구성을 메모리 문서에 기록하려다 막혔고, 그 훅을 고치는 명령조차 막혔다).
그래서 다른 가드들과 같은 방식으로 **명령 위치**에서만 매칭하고, SQL 키워드는 실제
DB 클라이언트 호출이 같은 명령에 있을 때만 위험으로 본다.

의도적 예외가 필요하면 명령에 OFFMODE_ALLOW_DANGEROUS=1 을 붙인다.
"""
import json
import re
import sys

# 명령 위치 = 줄 시작 또는 ; && || | ( ` $( 뒤 (env 접두 허용)
POS = r"(^|[;&|(`]|\$\()\s*([A-Za-z_][A-Za-z0-9_]*=\S*\s+)*"

# 1) 명령 위치에서만 판정하는 것들
POSITIONAL = [
    (re.compile(POS + r"(sudo\s+)?rm\s+(-\w+\s+)*-\w*[rR]\w*f\w*\s+(/|~|\$HOME)(\s|/|$)"),
     "rm -rf 로 루트/홈 디렉토리 삭제"),
    (re.compile(POS + r"(sudo\s+)?mkfs(\.\w+)?\s"), "파일시스템 포맷(mkfs)"),
    (re.compile(POS + r"(sudo\s+)?dd\s+[^;&|]*\bof=/dev/"), "dd 로 블록 디바이스 덮어쓰기"),
    (re.compile(POS + r"git\s+push\b[^;&|]*--no-verify"), "훅을 건너뛴 git push (--no-verify)"),
]

# 2) 파괴적 SQL — 실제 DB 클라이언트를 호출할 때만 위험으로 본다
DB_CLIENT = re.compile(POS + r"(mysql|mysqladmin|psql|mariadb|sqlite3|flyway)\b")
DESTRUCTIVE_SQL = [
    (re.compile(r"\bDROP\s+(DATABASE|SCHEMA|TABLE)\b", re.IGNORECASE), "DROP 문"),
    (re.compile(r"\bTRUNCATE\s+TABLE\b", re.IGNORECASE), "TRUNCATE 문"),
    (re.compile(r"\bDELETE\s+FROM\s+\w+\s*(;|\"|'|$)", re.IGNORECASE), "WHERE 없는 DELETE"),
]

# 3) 보호 브랜치 대상 force push
FORCE_PUSH = re.compile(POS + r"git\s+push\b")
FORCE_FLAG = re.compile(r"(--force(?!-with-lease)|(^|\s)-f(\s|$))")
PROTECTED = re.compile(r"\b(main|develop)\b")


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    cmd = (payload.get("tool_input") or {}).get("command", "")
    if not cmd:
        sys.exit(0)
    if "OFFMODE_ALLOW_DANGEROUS=1" in cmd:
        sys.exit(0)

    found = []

    for pattern, label in POSITIONAL:
        if pattern.search(cmd):
            found.append(label)

    if DB_CLIENT.search(cmd):
        for pattern, label in DESTRUCTIVE_SQL:
            if pattern.search(cmd):
                found.append(f"DB 클라이언트 호출에 {label}")

    for m in FORCE_PUSH.finditer(cmd):
        seg = re.split(r"[;&|]", cmd[m.start():])[0]
        if FORCE_FLAG.search(seg) and PROTECTED.search(seg):
            found.append("보호 브랜치(main/develop) 대상 force push")
            break

    if not found:
        sys.exit(0)

    sys.stderr.write(
        "⛔ 되돌리기 어려운 명령입니다 — 실행 전에 사람과 한 번 더 확인하세요.\n"
        + "".join(f"   · {f}\n" for f in found)
        + "   정말 필요하면 OFFMODE_ALLOW_DANGEROUS=1 접두를 붙여 다시 실행하세요.\n"
    )
    sys.exit(2)


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception:  # noqa: BLE001
        sys.exit(0)
