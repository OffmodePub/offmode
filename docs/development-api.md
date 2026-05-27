# 개발 API 서버 설정

앱은 Expo 공개 환경 변수에서 API 서버 설정을 읽습니다. `.env.example`을 `.env`로 복사한 뒤 테스트 기기에 필요한 값만 설정합니다.
`utils/api.js`의 `DEV_HOST` 같은 상수를 직접 수정하는 방식은 더 이상 사용하지 않으며, 개발 환경 설정은 아래의 환경 변수만으로 관리합니다.

## 기본값

- iOS 시뮬레이터: `http://localhost:8080`
- Android 에뮬레이터: `http://10.0.2.2:8080`
- 운영 빌드: `https://api.offmodechallenge.com` (AWS EC2 + Nginx + Let's Encrypt HTTPS)

## 실기기 테스트

휴대폰에서 테스트할 때 `localhost`는 개발 PC가 아니라 휴대폰 자신을 가리킵니다. 백엔드가 실행 중인 PC의 LAN IP를 설정하세요.

```env
EXPO_PUBLIC_DEV_API_HOST=192.168.0.10
EXPO_PUBLIC_DEV_API_PORT=8080
```

개발용 전체 URL을 직접 덮어쓸 수도 있습니다.

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.10:8080
```

`.env`를 바꾼 뒤에는 Expo를 재시작해야 변경된 값이 다시 번들링됩니다.

## 디버깅

개발 모드에서는 앱 시작 시 선택된 `BASE_URL`을 로그로 출력합니다. 네트워크 요청이 백엔드에 닿지 못하면 요청한 전체 URL도 로그로 남깁니다.
로그인이나 API 요청이 실패하면 Metro 콘솔에서 URL을 먼저 확인하고, 휴대폰 또는 에뮬레이터가 해당 주소에 접근할 수 있는지 확인하세요.
