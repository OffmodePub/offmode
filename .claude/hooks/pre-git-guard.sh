#!/usr/bin/env bash
# PreToolUse(Bash) 가드 — git commit / git push 시점에만 포맷·린트를 검증한다.
# 백엔드 .java 변경 → spotlessCheck, 프론트 .js/.jsx 변경 → npm run lint.
# 실패 시 exit 2 로 커밋/푸시를 차단하고 stderr 안내를 Claude 에게 돌려준다.
# (편집마다가 아니라 커밋/푸시 경계에서만 돌려 gradle 기동 비용을 회피)

set -uo pipefail

input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // ""' 2>/dev/null || echo "")

# git commit / git push 가 아니면 즉시 통과
if ! printf '%s' "$cmd" | grep -Eq '\bgit[[:space:]]+(commit|push)\b'; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
cd "$PROJECT_DIR" || exit 0

# 변경 파일 수집: push 는 upstream(없으면 origin/develop) 대비, commit 은 working tree 기준
if printf '%s' "$cmd" | grep -Eq '\bgit[[:space:]]+push\b'; then
  base=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || echo "origin/develop")
  changed=$(git diff --name-only "$base"...HEAD 2>/dev/null | sort -u)
else
  changed=$( { git diff --name-only 2>/dev/null; git diff --name-only --cached 2>/dev/null; } | sort -u )
fi

[ -z "$changed" ] && exit 0

fail=0

# 백엔드 Java 변경 → spotlessCheck
if printf '%s\n' "$changed" | grep -Eq '^backend/.*\.java$'; then
  echo "[pre-git-guard] 백엔드 Java 변경 감지 → ./gradlew spotlessCheck" >&2
  if ! ( cd backend && ./gradlew --quiet spotlessCheck ); then
    echo "❌ spotlessCheck 실패 — 'cd backend && ./gradlew spotlessApply' 실행 후 다시 시도하세요." >&2
    fail=1
  fi
fi

# 프론트 .js/.jsx 변경(backend 제외) → npm run lint
if printf '%s\n' "$changed" | grep -Ev '^backend/' | grep -Eq '\.(jsx?|tsx?)$'; then
  echo "[pre-git-guard] 프론트 변경 감지 → npm run lint" >&2
  if ! npm run --silent lint; then
    echo "❌ npm run lint 실패 — 린트 오류 수정 후 다시 시도하세요." >&2
    fail=1
  fi
fi

[ "$fail" -ne 0 ] && exit 2
exit 0
