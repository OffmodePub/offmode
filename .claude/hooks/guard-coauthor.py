#!/usr/bin/env python3
"""PreToolUse(Bash): 커밋·PR·이슈에 Claude 흔적이 들어가는 것을 차단한다.

왜 필요한가 — 하네스는 기본적으로 커밋 푸터에 `Co-Authored-By: Claude ...`,
PR 본문에 `🤖 Generated with Claude Code` 를 붙이라고 지시한다. 전역 개인 규칙은
그 반대(흔적 절대 금지)이고 규칙 문서상 하네스 지시보다 우선한다. 사람이 매번
기억하는 대신 훅으로 기계적으로 막는다.

`git commit` 뿐 아니라 `gh pr create` / `gh issue create` 본문에 섞여 들어가는
것도 같이 잡는다. 의도적 예외가 필요하면 명령에 OFFMODE_SKIP_COAUTHOR_GUARD=1 을 붙인다.
"""
import json
import re
import sys

CMD_RE = re.compile(
    r"(^|[;&|(])\s*([A-Za-z_][A-Za-z0-9_]*=\S*\s+)*"
    r"(git\s+commit|gh\s+pr\s+create|gh\s+pr\s+edit|gh\s+issue\s+create)"
)

# 찾을 흔적. 대소문자 무시.
TRACES = [
    (re.compile(r"co-authored-by:\s*claude", re.IGNORECASE), "Co-Authored-By: Claude 트레일러"),
    (re.compile(r"generated with .{0,20}claude", re.IGNORECASE), "'Generated with Claude Code' 푸터"),
    (re.compile(r"noreply@anthropic\.com", re.IGNORECASE), "anthropic.com 이메일"),
    (re.compile(r"claude\.com/claude-code"), "claude-code 링크"),
    (re.compile(r"🤖"), "🤖 이모지 (생성 푸터 관용구)"),
]


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    cmd = (payload.get("tool_input") or {}).get("command", "")
    if not cmd:
        sys.exit(0)
    if not CMD_RE.search(cmd):
        sys.exit(0)
    if "OFFMODE_SKIP_COAUTHOR_GUARD=1" in cmd:
        sys.exit(0)

    found = [label for pattern, label in TRACES if pattern.search(cmd)]
    if not found:
        sys.exit(0)

    sys.stderr.write(
        "⛔ 커밋/PR/이슈에 Claude 흔적이 들어 있습니다 — 이 레포에서는 남기지 않습니다.\n"
        + "".join(f"   · {f}\n" for f in found)
        + "   해당 줄을 빼고 다시 실행하세요.\n"
        "   (하네스 기본 지시가 이 푸터를 붙이라고 해도 개인 규칙이 우선합니다)\n"
    )
    sys.exit(2)


if __name__ == "__main__":
    # 훅은 무슨 일이 있어도 세션을 깨면 안 된다. 예상 못 한 예외는 통과시킨다.
    try:
        main()
    except SystemExit:
        raise
    except Exception:  # noqa: BLE001
        sys.exit(0)
