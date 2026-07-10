#!/usr/bin/env bash
# PostToolUse(Edit|Write) 가드 — CLAUDE.md 프론트 컨벤션을 기계적으로 강제한다.
# 파일 전체가 아니라 "이번 편집에서 새로 추가된 내용"만 검사해서
# 레거시 위반이 남아 있는 파일을 편집할 때 불필요하게 차단하지 않는다.
#
# 검사 항목:
#  1. utils/api.js 에 IP 하드코딩 (에뮬레이터 기본값 10.0.2.2 제외)
#  2. screens/ components/ App.jsx 에 <Text> 직접 사용 (→ <T> 사용)
#  3. 위 경로에 하드코딩 hex 색상 (허용: #000, #fff, 그린 버튼 계열)

set -uo pipefail

input=$(cat)
tool=$(printf '%s' "$input" | jq -r '.tool_name // ""' 2>/dev/null || echo "")
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // ""' 2>/dev/null || echo "")

case "$tool" in
  Edit)  added=$(printf '%s' "$input" | jq -r '.tool_input.new_string // ""' 2>/dev/null || echo "") ;;
  Write) added=$(printf '%s' "$input" | jq -r '.tool_input.content // ""' 2>/dev/null || echo "") ;;
  *) exit 0 ;;
esac

[ -z "$file" ] || [ -z "$added" ] && exit 0

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
rel="${file#"$PROJECT_DIR"/}"

msgs=""

# 1) utils/api.js — IP 하드코딩 금지 (.env 의 EXPO_PUBLIC_* 로 설정)
if [ "$rel" = "utils/api.js" ]; then
  ips=$(printf '%s' "$added" | grep -Eo '([0-9]{1,3}\.){3}[0-9]{1,3}' | grep -Ev '^(10\.0\.2\.2|127\.0\.0\.1)$' | sort -u | tr '\n' ' ')
  if [ -n "${ips// /}" ]; then
    msgs="${msgs}❌ utils/api.js 에 IP 하드코딩 금지 (감지: ${ips}) — .env 의 EXPO_PUBLIC_DEV_API_HOST / EXPO_PUBLIC_API_BASE_URL 로 설정하세요 (docs/development-api.md).\n"
  fi
fi

# 2)~3) 프론트 화면/컴포넌트 컨벤션
case "$rel" in
  screens/*.jsx|screens/*.js|components/*.jsx|components/*.js|App.jsx)
    base=$(basename "$rel")
    # 텍스트 래퍼 컴포넌트 자신은 예외
    if [ "$base" != "ThemedText.js" ] && [ "$base" != "WarmText.jsx" ]; then
      # <Text> 직접 사용 (<TextInput 등은 제외)
      if printf '%s' "$added" | grep -Eq '<Text[^A-Za-z]'; then
        msgs="${msgs}❌ <Text> 직접 사용 금지 — components/ThemedText.js 의 <T v=\"body\">...</T> 를 사용하세요 (CLAUDE.md 프론트 규칙).\n"
      fi
      # 하드코딩 hex 색상 (허용: 검정/흰색, 그린 버튼 고정값)
      hexes=$(printf '%s' "$added" | grep -Eo '#[0-9a-fA-F]{3,8}' \
        | grep -Eiv '^#(000|000000|fff|ffffff|22c97a|26d67a|1ab065)$' | sort -u | head -5 | tr '\n' ' ')
      if [ -n "${hexes// /}" ]; then
        msgs="${msgs}⚠️ 하드코딩 색상 감지 (${hexes}) — useColors() 토큰(C.bg/C.surface/C.green/C.text/...)을 사용하세요. 새 색상이 필요하면 constants/colors.js 의 dark/light 양쪽에 추가합니다.\n"
      fi
    fi
    ;;
esac

if [ -n "$msgs" ]; then
  printf '%b' "$msgs" >&2
  exit 2
fi
exit 0
