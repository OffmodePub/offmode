/**
 * Haptics utility — 앱 전체에서 햅틱 피드백을 일관되게 사용하기 위한 모듈.
 *
 * TODO: 햅틱 정식 도입 전까지 실제 네이티브 호출은 비활성화한다.
 * 재도입 시 아래 expo-haptics import와 각 함수의 원래 호출부를 복구한다.
 *
 * 사용법:
 *   import * as H from '../utils/haptics';
 *   H.tap();       // 가벼운 클릭감
 *   H.medium();    // 중간 강도
 *   H.success();   // 완료 피드백
 */
// import * as Haptics from 'expo-haptics';

let _enabled = false;

export const setEnabled = (v) => { _enabled = v; };
export const isEnabled  = ()  => _enabled;

export const tap = () => {
  // TODO: if (_enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};
export const medium = () => {
  // TODO: if (_enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};
export const success = () => {
  // TODO: if (_enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};
export const error = () => {
  // TODO: if (_enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};
