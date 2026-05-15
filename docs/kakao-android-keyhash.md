# 카카오 안드로이드 키 해시 (Kakao Android Key Hash)

앱의 APK를 서명한 인증서가 카카오 디벨로퍼스에 등록된 키 해시 값과 일치하지 않으면, 안드로이드 카카오 로그인 시 `Android keyHash validation failed` 에러가 발생하며 로그인이 실패합니다.

## 현재 디버그 빌드 환경 (Current Debug Build)

현재 로컬 안드로이드 디버그 빌드는 `android/app/build.gradle` 파일에 설정된 저장소 키스토어(keystore)를 사용하여 서명되어 있습니다. 구체적인 설정값은 다음과 같습니다.

* **키스토어 경로:** `android/app/debug.keystore`
* **키 별칭 (alias):** `androiddebugkey`
* **저장소 비밀번호 (store password):** `android`
* **키 비밀번호 (key password):** `android`
* **안드로이드 패키지명:** `com.minnnj.offmode`
* **카카오 네이티브 앱 키:** `62ae912ced27c2b48181b0a6d1c84353`
* **카카오 리다이렉트 스킴:** `kakao62ae912ced27c2b48181b0a6d1c84353`

카카오 디벨로퍼스의 안드로이드 플랫폼 설정에 다음 키 해시 값을 등록해야 합니다.

```text
Xo8WBi6jzSxKDVR4drqm84yr9iU=
```

## 키 해시 재계산 방법 (Recalculate)

프로젝트 최상위 폴더(루트 경로)에서 다음 명령어를 실행하여 키 해시를 다시 계산하고 확인할 수 있습니다.

```powershell
npm run kakao:keyhash:android
```

정상적으로 실행되었다면 다음과 같은 결과가 출력되어야 합니다.

```text
SHA1: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
Kakao Android key hash: Xo8WBi6jzSxKDVR4drqm84yr9iU=
```

만약 프로젝트 내의 키스토어가 아닌, 로컬 PC 환경의 다른 디버그 키스토어(예: 안드로이드 스튜디오 기본 키스토어)를 사용 중이라면 다음과 같이 경로를 직접 지정하여 스크립트를 실행하세요.

```powershell
npm run kakao:keyhash:android -- --keystore "$env:USERPROFILE\.android\debug.keystore"
```

`keytool`이 PATH에 없으면 `JAVA_HOME`을 JDK 경로로 설정하거나 `KEYTOOL` 환경 변수로 keytool 실행 파일 경로를 지정합니다.

## 카카오 디벨로퍼스 확인 사항 (Kakao Developers Checklist)

카카오 디벨로퍼스 사이트의 **내 애플리케이션 > 앱 설정 > 플랫폼 > Android** 메뉴로 이동하여 다음 세 가지가 올바르게 설정되었는지 확인하세요.

1. **패키지명**이 `com.minnnj.offmode` 로 되어 있는가?
2. **키 해시** 항목에 `Xo8WBi6jzSxKDVR4drqm84yr9iU=` 가 포함되어 있는가?
3. **네이티브 앱 키**가 `62ae912ced27c2b48181b0a6d1c84353` 과 일치하는가?

> **주의 사항 (운영/배포 시)**
> 릴리스(Release) 빌드, EAS(Expo 배포 서비스) 빌드, 또는 구글 플레이 스토어의 앱 서명(Play App Signing)을 사용하는 빌드의 경우 **현재 디버그용과 다른 서명 인증서가 사용됩니다.** 따라서 앱을 서명할 때 사용되는 각각의 인증서마다 별도로 키 해시를 추출하여 카카오 디벨로퍼스에 추가로 등록해주어야 실제 배포된 앱에서도 카카오 로그인이 정상 작동합니다.
