#!/usr/bin/env bash
# Claude Code statusLine — 전역 bridge 출력 + 이 레포 전용 백엔드 기동 표시.
#
# 전역 ~/.claude/settings.json 은 claude-status-bridge.js 로 세션명·브랜치·모델·
# 컨텍스트·사용량·세션상태를 한 줄로 낸다. 프로젝트 statusLine 은 전역을 덮어쓰므로,
# 여기서 같은 bridge 를 호출해 그 형태를 그대로 유지하고 뒤에 8080 만 덧붙인다.
# (offmode 는 백엔드를 안 띄우고 앱을 켜는 함정이 잦아 기동 여부가 한눈에 필요하다)

input=$(cat)

# 백엔드(8080) 기동 여부 — bash /dev/tcp 는 즉시 반환
be="⚪8080"
(exec 3<>/dev/tcp/127.0.0.1/8080) 2>/dev/null && { exec 3>&- 3<&-; be="🟢8080"; }

BRIDGE="$HOME/.claude/claude-status-bridge.js"
line=""
if [ -f "$BRIDGE" ] && command -v node >/dev/null 2>&1; then
  line=$(printf '%s' "$input" | node "$BRIDGE" 2>/dev/null | tr -d '\n')
fi

if [ -n "$line" ]; then
  printf '%s │ %s' "$line" "$be"
  exit 0
fi

# bridge 를 못 쓰는 경우의 폴백 — 모델/브랜치/디렉토리만이라도 보여준다
model=$(printf '%s' "$input" | jq -r '.model.display_name // "?"' 2>/dev/null || echo "?")
dir=$(printf '%s' "$input" | jq -r '.workspace.current_dir // .cwd // "."' 2>/dev/null || echo ".")
branch=$(git -C "$dir" branch --show-current 2>/dev/null || echo "-")
printf '%s  ⎇ %s  📁 %s  %s' "$model" "$branch" "$(basename "$dir")" "$be"
