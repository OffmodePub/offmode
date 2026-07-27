/**
 * Analytics utility — Meta(Facebook) 앱 이벤트 로깅 모듈.
 *
 * 광고 성과 측정·최적화를 위해 Meta SDK 에 앱 이벤트를 전달한다.
 * SDK 자체 초기화는 app.json 의 react-native-fbsdk-next plugin
 * (`isAutoInitEnabled: true`) 이 네이티브에서 처리하고, 이 모듈은
 * iOS ATT 권한 처리와 이벤트 로깅만 담당한다.
 *
 * 사용법:
 *   import * as A from '../utils/analytics';
 *   await A.initAnalytics();          // 앱 시작 시 1회 (App.jsx)
 *   A.logRegistration('kakao');       // 신규 가입 완료
 *   A.logMissionVerified(missionId);  // 미션 인증 성공 (첫 회만 튜토리얼 완료로 전송)
 *   A.logAchievement('badge_first');  // 뱃지 획득·친구 초대
 *   A.logFeedView();                  // 피드 진입
 *
 * 이벤트명은 Meta 표준 이벤트 상수를 그대로 쓴다. 임의 문자열을 쓰면
 * 커스텀 이벤트로 잡혀서 광고 최적화 대상에서 빠진다.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Meta 표준 이벤트명 (SDK 내부 상수와 동일한 문자열)
const EV = {
  COMPLETE_REGISTRATION: 'fb_mobile_complete_registration',
  COMPLETE_TUTORIAL: 'fb_mobile_tutorial_completion',
  UNLOCK_ACHIEVEMENT: 'fb_mobile_achievement_unlocked',
  VIEW_CONTENT: 'fb_mobile_content_view',
};

// Meta 표준 매개변수 키
const P = {
  CONTENT_ID: 'fb_content_id',
  CONTENT_TYPE: 'fb_content_type',
  REGISTRATION_METHOD: 'fb_registration_method',
  DESCRIPTION: 'fb_description',
  SUCCESS: 'fb_success',
};

const FIRST_VERIFY_KEY = 'analytics_first_verify_logged';

const debug = (...args) => {
  if (__DEV__) console.log('[analytics]', ...args);
};

/**
 * Meta SDK 와 ATT 모듈은 **import 되는 순간** 네이티브를 건드린다.
 *   - react-native-fbsdk-next  → `new NativeEventEmitter(NativeModules.FBAccessToken)`
 *   - expo-tracking-transparency → `requireNativeModule('ExpoTrackingTransparency')`
 * 네이티브가 없는 클라이언트(Expo Go, Meta SDK 도입 전에 만든 dev-client 빌드)에서는
 * `NativeEventEmitter requires a non-null argument` 로 앱 전체가 뜨지 않는다.
 * 정적 import 라 호출부 try/catch 로는 못 막으므로, 런타임 require 로 늦게 불러오고
 * 실패하면 이벤트 로깅만 통째로 no-op 으로 둔다.
 */
const optionalRequire = (label, load) => {
  try {
    return load();
  } catch (e) {
    debug(`${label} 네이티브 모듈 없음 — 로깅 비활성화`, e?.message);
    return null;
  }
};

const FB = optionalRequire('Meta SDK', () => require('react-native-fbsdk-next'));

// Meta SDK 가 없으면 ATT 권한도 쓸 데가 없으므로 같이 건너뛴다.
const ATT = FB ? optionalRequire('ATT', () => require('expo-tracking-transparency')) : null;

/** Meta SDK 가 없는 빌드에서는 조용히 건너뛴다. 호출은 실패해도 앱 흐름을 막지 않는다. */
const safe = (fn) => {
  if (!FB) return;
  try {
    fn();
  } catch (e) {
    debug('이벤트 전송 실패', e?.message);
  }
};

/**
 * 앱 시작 시 1회 호출. iOS 는 ATT 권한을 요청한 뒤 그 결과를 SDK 에 반영한다.
 *
 * ATT 를 거부해도 이벤트 자체는 계속 전송된다. 다만 광고 식별자(IDFA)가
 * 빠져서 광고↔설치 연결 정확도가 떨어지고, SKAdNetwork 집계에만 의존하게 된다.
 */
export async function initAnalytics() {
  if (!FB) return;

  if (Platform.OS !== 'ios') {
    FB.Settings.initializeSDK();
    return;
  }

  let granted = false;
  try {
    const current = await ATT.getTrackingPermissionsAsync();
    // 아직 묻지 않은 경우에만 시스템 팝업을 띄운다 (재요청은 불가).
    const status = current.canAskAgain && current.status !== 'granted'
      ? (await ATT.requestTrackingPermissionsAsync()).status
      : current.status;
    granted = status === 'granted';
  } catch (e) {
    debug('ATT 권한 확인 실패', e?.message);
  }

  debug('ATT 허용 여부', granted);
  await FB.Settings.setAdvertiserTrackingEnabled(granted);
  FB.Settings.initializeSDK();
}

/** 신규 가입 완료. method 는 'kakao' | 'apple'. */
export function logRegistration(method) {
  safe(() => {
    FB.AppEventsLogger.logEvent(EV.COMPLETE_REGISTRATION, {
      [P.REGISTRATION_METHOD]: method ?? 'unknown',
    });
  });
}

/**
 * 미션 인증 성공.
 *
 * 첫 인증만 '튜토리얼 완료'로 전송한다. 설치 후 실제로 미션을 완주한
 * 사용자를 가려내는 지표라, 매번 보내면 의미가 희석된다.
 */
export async function logMissionVerified(missionId) {
  // SDK 가 없을 때 '첫 인증 기록'을 남겨버리면 정상 빌드에서 이벤트가 유실된다.
  if (!FB) return;

  let alreadyLogged = null;
  try {
    alreadyLogged = await SecureStore.getItemAsync(FIRST_VERIFY_KEY);
  } catch (e) {
    debug('첫 인증 여부 조회 실패', e?.message);
    return;
  }
  if (alreadyLogged) return;

  safe(() => {
    FB.AppEventsLogger.logEvent(EV.COMPLETE_TUTORIAL, {
      [P.SUCCESS]: 1,
      [P.CONTENT_ID]: String(missionId ?? ''),
    });
  });

  try {
    await SecureStore.setItemAsync(FIRST_VERIFY_KEY, '1');
  } catch (e) {
    debug('첫 인증 기록 저장 실패', e?.message);
  }
}

/** 뱃지 획득·친구 초대 성공 등 성취 달성. */
export function logAchievement(description) {
  safe(() => {
    FB.AppEventsLogger.logEvent(EV.UNLOCK_ACHIEVEMENT, {
      [P.DESCRIPTION]: description ?? '',
    });
  });
}

/** 피드 탭 진입. */
export function logFeedView() {
  safe(() => {
    FB.AppEventsLogger.logEvent(EV.VIEW_CONTENT, {
      [P.CONTENT_TYPE]: 'feed',
      [P.CONTENT_ID]: 'feed_tab',
    });
  });
}

/** 로그아웃 시 첫 인증 기록 초기화 (다른 계정으로 재로그인 대비). */
export async function resetAnalyticsState() {
  try {
    await SecureStore.deleteItemAsync(FIRST_VERIFY_KEY);
  } catch (e) {
    debug('상태 초기화 실패', e?.message);
  }
}
