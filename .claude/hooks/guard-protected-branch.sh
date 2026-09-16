#!/usr/bin/env bash
# PreToolUse(Bash) 훅: develop/main 브랜치 위에서의 git commit/push, 그리고
# develop/main 으로의 직접 push 를 차단한다.
#
# 왜 필요한가 — 다른 터미널에서 develop 으로 checkout 한 상태가 그대로 남아 있으면
# 작업 브랜치인 줄 알고 커밋한 것이 develop 에 직접 들어간다. 이 레포는 브랜치 보호가
# 걸려 있지 않아 GitHub 쪽 방어선도 없다. 배포·머지는 PR 을 거쳐야 한다.
#
# 의도적 예외가 필요하면 명령에 OFFMODE_ALLOW_PROTECTED=1 마커를 붙인다.

INPUT=$(cat)

printf '%s' "$INPUT" | grep -Eq 'git.{0,60}(commit|push)' || exit 0

CMD=$(printf '%s' "$INPUT" | python3 -c \
  "import json,sys; print(json.load(sys.stdin).get('tool_input', {}).get('command', ''))" \
  2>/dev/null)
[ -z "$CMD" ] && exit 0

# 명령 위치에서의 git commit/push 만 매칭 (문자열 안 문구 오탐 방지)
printf '%s' "$CMD" | grep -Eq '(^|[;&|(])[[:space:]]*([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]+)*git[[:space:]]+(commit|push)' || exit 0

# 의도적 예외 마커
printf '%s' "$CMD" | grep -q 'OFFMODE_ALLOW_PROTECTED=1' && exit 0

# 실제로 커밋/푸시가 일어날 디렉터리를 판정한다.
# 훅 파일 기준 레포 루트만 보면 worktree 커밋에서 항상 메인 트리의 HEAD 를 읽어
# 작업 브랜치인데도 차단하는 오탐이 난다. 명령의 `cd <path>` / `git -C <path>`
# → 훅 cwd → 레포 루트 순으로 후보를 잡아 실제 대상의 HEAD 를 본다.
TARGET_DIR=$(printf '%s' "$INPUT" | python3 -c "
import json, os, shlex, sys

data = json.load(sys.stdin)
cmd = data.get('tool_input', {}).get('command', '')
cwd = data.get('cwd', '') or ''

try:
    toks = shlex.split(cmd)
except ValueError:
    toks = cmd.split()

target = ''
for i, t in enumerate(toks):
    if t == 'cd' and i + 1 < len(toks):
        target = toks[i + 1]
        break
    if t == '-C' and i > 0 and toks[i - 1] == 'git' and i + 1 < len(toks):
        target = toks[i + 1]
        break

# 상대 경로는 세션 cwd 기준으로 절대화한다 (cd ../other-worktree 형태)
if target and not os.path.isabs(target) and cwd:
    target = os.path.normpath(os.path.join(cwd, target))

print(target or cwd)
" 2>/dev/null)

if [ -n "$TARGET_DIR" ] && [ -d "$TARGET_DIR" ]; then
  cd "$TARGET_DIR" 2>/dev/null || cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
else
  cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
fi
BR=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0

# 1) HEAD 가 develop/main 인 상태에서 commit/push 차단
if [ "$BR" = "main" ] || [ "$BR" = "develop" ]; then
  echo "⛔ 현재 HEAD 가 보호 브랜치(${BR})입니다. 다른 터미널에서 checkout 됐을 수 있습니다." >&2
  echo "   작업 브랜치로 옮긴 뒤(git switch -c <prefix>/<이슈번호>) 다시 시도하세요." >&2
  echo "   의도적이면 OFFMODE_ALLOW_PROTECTED=1 접두." >&2
  exit 2
fi

# 2) develop/main 으로의 명시적 직접 push 차단 (반영은 PR 머지로만)
if printf '%s' "$CMD" | grep -Eq 'git[[:space:]]+push[[:space:]]+[^;&|]*\b(main|develop)\b'; then
  echo "⛔ develop/main 으로의 직접 push 는 차단됩니다. PR 머지로만 반영하세요." >&2
  echo "   의도적이면 OFFMODE_ALLOW_PROTECTED=1 접두." >&2
  exit 2
fi

exit 0
