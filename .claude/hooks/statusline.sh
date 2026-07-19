#!/usr/bin/env bash
# Claude Code statusLine — 모델 / git 브랜치 / 디렉토리 / 컨텍스트 경고 표시.
# 컨텍스트가 가득 차기 전에 새 세션을 시작할 시점을 시각적으로 판단하기 위함.

input=$(cat)

model=$(printf '%s' "$input" | jq -r '.model.display_name // "?"' 2>/dev/null || echo "?")
dir=$(printf '%s' "$input" | jq -r '.workspace.current_dir // .cwd // "."' 2>/dev/null || echo ".")
branch=$(git -C "$dir" branch --show-current 2>/dev/null || echo "-")

# 200k 초과 신호가 오면 경고 (가용 필드일 때만)
over=$(printf '%s' "$input" | jq -r '.exceeds_200k_tokens // empty' 2>/dev/null || echo "")
ctx=""
[ "$over" = "true" ] && ctx="  ⚠️ 200k+ (새 세션 권장)"

# 백엔드(8080) 기동 여부 — 앱 실행 전 백엔드 안 띄운 함정을 한눈에 (bash /dev/tcp: 즉시 반환)
be="⚪8080"
(exec 3<>/dev/tcp/127.0.0.1/8080) 2>/dev/null && { exec 3>&- 3<&-; be="🟢8080"; }

printf '%s  ⎇ %s  📁 %s  %s%s' "$model" "$branch" "$(basename "$dir")" "$be" "$ctx"
