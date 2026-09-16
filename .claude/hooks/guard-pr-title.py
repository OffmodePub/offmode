#!/usr/bin/env python3
"""PreToolUse(Bash): PR 제목이 이 레포의 형식을 지키는지 로컬에서 먼저 검사한다.

왜 필요한가 — `.github/workflows/pr-title.yml` 이 같은 규칙을 CI 에서 강제하지만,
어긋나면 PR 을 올린 뒤에야 빨간불로 알게 되고 제목 수정 → 재실행 왕복이 생긴다.
푸시 전에 같은 정규식으로 잡아 왕복을 없앤다.

허용 형식 (CI 와 동일):
  [Feat] #23 로그인 API 구현
  [Chore] #1, 2, 4 설정 파일 업데이트
허용 TYPE: Feat, Fix, Refactor, Docs, Test, Chore, Infra

의도적 예외가 필요하면 명령에 OFFMODE_SKIP_TITLE_GUARD=1 을 붙인다.
"""
import json
import re
import shlex
import sys

# 명령 위치(줄 시작 또는 ; && || | ( 뒤, env 접두 허용)에서의 gh pr create/edit 만 매칭.
# 따옴표 문자열 안의 "gh pr create" 문구는 오탐하지 않는다.
CMD_RE = re.compile(
    r"(^|[;&|(])\s*([A-Za-z_][A-Za-z0-9_]*=\S*\s+)*gh\s+pr\s+(create|edit)"
)

# .github/workflows/pr-title.yml 의 REGEX 와 동일하게 유지할 것.
TITLE_RE = re.compile(r"^\[(Feat|Fix|Refactor|Docs|Test|Chore|Infra)\] #[0-9]+([, ]+#?[0-9]+)* .+$")

TYPES = "Feat, Fix, Refactor, Docs, Test, Chore, Infra"


def extract_title(cmd):
    """`--title <값>` / `--title=<값>` 을 셸 파싱으로 꺼낸다.

    따옴표·이스케이프를 직접 다루면 틀리므로 shlex 에 맡긴다.
    파싱이 실패하면(복잡한 인용) None 을 돌려주고 통과시킨다 —
    가드가 정상 작업을 막는 쪽이 더 나쁘다.
    """
    try:
        tokens = shlex.split(cmd, comments=False)
    except ValueError:
        return None
    for i, tok in enumerate(tokens):
        if tok in ("--title", "-t") and i + 1 < len(tokens):
            return tokens[i + 1]
        if tok.startswith("--title="):
            return tok[len("--title=") :]
    return None


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    cmd = (payload.get("tool_input") or {}).get("command", "")
    if not cmd or "gh" not in cmd:
        sys.exit(0)
    if not CMD_RE.search(cmd):
        sys.exit(0)
    if "OFFMODE_SKIP_TITLE_GUARD=1" in cmd:
        sys.exit(0)

    title = extract_title(cmd)
    if title is None:
        sys.exit(0)
    if TITLE_RE.match(title):
        sys.exit(0)

    sys.stderr.write(
        "⛔ PR 제목 형식이 맞지 않습니다 — 이대로 올리면 PR Title Check 가 실패합니다.\n"
        f"   받은 제목: {title}\n"
        "   형식: [Type] #이슈번호 한국어 요약\n"
        "   예시: [Feat] #23 로그인 API 구현 / [Chore] #1, 2, 4 설정 파일 업데이트\n"
        f"   허용 TYPE: {TYPES}\n"
        "   (대괄호 타입입니다. conventional 형식 `feat:` 은 커밋이 아니라 PR 제목에서는 쓰지 않습니다)\n"
        "   의도적으로 넘기려면 OFFMODE_SKIP_TITLE_GUARD=1 접두.\n"
    )
    sys.exit(2)


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception:  # noqa: BLE001
        sys.exit(0)
