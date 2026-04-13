/**
 * Haptics utility — 앱 전체에서 햅틱 피드백을 일관되게 사용하기 위한 모듈.
 *
 * 설정 화면의 토글과 연동되어 있음.
 * setEnabled(false) 하면 모든 햅틱이 무음 처리됨.
 *
 * 사용법:
 *   import * as H from '../utils/haptics';
 *   H.tap();       // 가벼운 클릭감
 *   H.medium();    // 중간 강도
 *   H.success();   // 완료 피드백
 */
import * as Haptics from 'expo-haptics';

let _enabled = true;

export const setEnabled = (v) => { _enabled = v; };
export const isEnabled  = ()  => _enabled;

export const tap = () => {
  if (_enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};
export const medium = () => {
  if (_enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};
export const success = () => {
  if (_enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};
export const error = () => {
  if (_enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};
