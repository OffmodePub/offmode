# 초대 링크 / 딥링크 호스팅 (offmodechallenge.com)

카톡 등으로 공유되는 초대 링크 `https://offmodechallenge.com/invite/{CODE}` 를 처리하기 위한 웹/서버 설정.
앱 코드(공유 링크 생성·딥링크 라우팅)는 이미 반영됨. 아래 런북대로 **루트 도메인**을 세팅하면 동작한다.

## 폴더 구성
```
web/
  public/                                    ← 이 안의 내용만 웹 루트(/var/www/offmode)로 배포
    .well-known/apple-app-site-association    iOS Universal Link 검증 (appID 반영됨)
    .well-known/assetlinks.json               Android App Links 검증 (안드로이드 출시 시 SHA-256 기입)
    invite/index.html                         미설치자용 랜딩 (App Store id6767263531 반영됨)
  nginx/offmodechallenge.conf                Nginx server 블록 (그대로 배치)
  deploy.sh                                  정적 파일 배포 스크립트
  README.md                                  (이 문서)
```

## 현재 상태 (2026-07-08 확인)
- 도메인 `offmodechallenge.com` : Cloudflare 등록됨 ✅ / **apex(@) A레코드 없음** ← 이것만 추가하면 됨
- `api.offmodechallenge.com` → `43.202.90.1` (EC2, DNS-only). 루트도 동일 방식으로 맞춘다.

## 런북 (EC2 + Cloudflare)

### ① Cloudflare DNS — A레코드 추가
- Type `A`, Name `@`, IPv4 `43.202.90.1`, **Proxy status: DNS only(회색 구름)** ← api. 와 동일

### ② Nginx server 블록 배치
```bash
sudo cp web/nginx/offmodechallenge.conf /etc/nginx/conf.d/offmodechallenge.conf
sudo nginx -t && sudo systemctl reload nginx
```

### ③ TLS 인증서 발급 (certbot 이 443 + 리다이렉트 자동 구성)
```bash
sudo certbot --nginx -d offmodechallenge.com
```

### ④ 정적 파일 배포
```bash
bash web/deploy.sh
# 내부적으로: web/public/ → /var/www/offmode 로 rsync + nginx reload
```

### ⑤ 검증
```bash
curl -I https://offmodechallenge.com/.well-known/apple-app-site-association
#   → HTTP 200, Content-Type: application/json, 리다이렉트 없어야 함
curl https://offmodechallenge.com/invite/RUN777
#   → 랜딩 HTML, 코드 RUN777 표시
```

## iOS 쪽 남은 작업 (앱)
- `app.json` 에 `scheme`·`ios.associatedDomains(applinks:offmodechallenge.com)` 반영됨 → **네이티브 리빌드 + App Store 재제출 필요**.
- iOS 는 AASA 를 앱 첫 실행 시 캐시한다. **웹 배포 + 새 빌드 설치가 둘 다 끝난 뒤** 테스트할 것.

## 안드로이드 (미출시 — 나중에)
출시 시: `public/.well-known/assetlinks.json` 의 `sha256_cert_fingerprints` 를 실제 서명 키 SHA-256(Play Console → 앱 무결성 → 앱 서명 키)으로 채우고, 랜딩에 Play Store 버튼을 되살린다. `app.json` 의 `android.intentFilters` 는 미리 반영돼 있음.

## 참고
- 링크 도착지 값 반영 완료: **App Store `id6767263531`**, appID `SX5KZM28U5.com.minnnj.offmode`.
- AASA 파일 변경 후에는 iOS 앱 재설치가 필요할 수 있음(캐시).
