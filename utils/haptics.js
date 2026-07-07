/**
 * Haptics utility — 앱 전체에서 햅틱 피드백을 일관되게 사용하기 위한 모듈.
 *
 * 각 함수는 햅틱(설정 on/off = _enabled)과 효과음(sounds.js, 독립 플래그)을
 * 함께 트리거한다. 그래서 앱 전역의 기존 H.tap()/H.success() 호출부가 별도
 * 수정 없이 두 피드백을 모두 낸다. 두 설정은 SettingsScreen 에서 각각 토글하고
 * 앱 시작 시 App.jsx 가 SecureStore 값으로 복원한다.
 *
 * 사용법:
 *   import * as H from '../utils/haptics';
 *   H.tap();       // 가벼운 클릭감
 *   H.medium();    // 중간 강도
 *   H.success();   // 완료 피드백
 */
import * as Haptics from 'expo-haptics';
import * as S from './sounds';

let _enabled = true; // 햅틱 기본 켜짐 (SecureStore 값으로 시작 시 덮어씀)

export const setEnabled = (v) => { _enabled = v; };
export const isEnabled  = ()  => _enabled;

export const tap = () => {
  if (_enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  S.tap();
};
export const medium = () => {
  if (_enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  S.tap();
};
export const success = () => {
  if (_enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  S.success();
};
export const error = () => {
  if (_enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  S.error();
};
