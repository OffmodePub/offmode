#!/usr/bin/env bash
# offmodechallenge.com 정적 파일 배포 (EC2 에서 실행)
#
# 사용: 레포 루트에서  bash web/deploy.sh
#      또는           bash web/deploy.sh /경로/web/public
#
# web/public/ 아래 내용(.well-known, invite)만 웹 루트로 복사한다.
# nginx 설정·스크립트·README 는 배포되지 않는다.
set -euo pipefail

SRC="${1:-$(dirname "$0")/public}"
DEST="/var/www/offmode"

if [ ! -f "$SRC/.well-known/apple-app-site-association" ]; then
  echo "오류: $SRC 에 배포할 정적 파일이 없습니다. web/public 경로를 확인하세요." >&2
  exit 1
fi

sudo mkdir -p "$DEST"
sudo rsync -a --delete "$SRC"/ "$DEST"/
sudo nginx -t
sudo systemctl reload nginx
echo "✅ 배포 완료 → $DEST"
echo "검증: curl -I https://offmodechallenge.com/.well-known/apple-app-site-association"
