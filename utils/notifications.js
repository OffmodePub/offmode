import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';

const SILENT_NOTIFICATION_CHANNEL_ID = 'offmode-silent-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    // TODO: 효과음 정식 도입 시 true로 복구한다.
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function ensureSilentNotificationChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(SILENT_NOTIFICATION_CHANNEL_ID, {
    name: 'Offmode notifications',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
  });
}

// 매일 설정한 시간에 반복 알림 예약 (기존 미션 알림 교체)
export async function scheduleMissionNotification(hour, minute) {
  await cancelMissionNotification();

  const granted = await requestNotificationPermission();
  if (!granted) return;
  await ensureSilentNotificationChannel();

  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-mission',
    content: {
      title: '🎯 오늘의 미션 도착!',
      body: '지금 바로 확인하고 갓생을 시작해봐요 🔥',
      // TODO: 효과음 정식 도입 시 true로 복구한다.
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: SILENT_NOTIFICATION_CHANNEL_ID,
    },
  });
}

export async function cancelMissionNotification() {
  await Notifications.cancelScheduledNotificationAsync('daily-mission');
}

export async function scheduleReminderNotification() {
  await cancelReminderNotification();
  const granted = await requestNotificationPermission();
  if (!granted) return;
  await ensureSilentNotificationChannel();
  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-reminder',
    content: {
      title: '⏰ 오늘 미션 아직 완료 안 했어요!',
      body: '지금 완료하고 오늘 하루 마무리해요 🌙',
      // TODO: 효과음 정식 도입 시 true로 복구한다.
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 21,
      minute: 0,
      channelId: SILENT_NOTIFICATION_CHANNEL_ID,
    },
  });
}

export async function cancelReminderNotification() {
  await Notifications.cancelScheduledNotificationAsync('daily-reminder');
}

/* ── 원격 푸시 (콕 찌르기 등 서버 발송) ───────────────────── */

/**
 * Expo 푸시 토큰을 발급받아 서버에 등록한다.
 * 시뮬레이터·권한 거부 등으로 실패하면 조용히 넘어간다 (원격 푸시는 실기기에서만 동작).
 * projectId 는 expo-notifications 가 app.json 의 extra.eas.projectId 에서 알아서 읽는다.
 */
export async function registerPushToken() {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return null;
    await ensureSilentNotificationChannel();

    const { data: token } = await Notifications.getExpoPushTokenAsync();
    if (!token) return null;

    await api.put('/api/v1/users/me/push-token', { token });
    return token;
  } catch (e) {
    if (__DEV__) console.warn('푸시 토큰 등록 실패:', e?.message ?? e);
    return null;
  }
}

/** 로그아웃 시 서버에 등록된 토큰을 해제해 다른 계정으로 오배송되지 않게 한다. */
export async function unregisterPushToken() {
  try {
    await api.put('/api/v1/users/me/push-token', { token: null });
  } catch (e) {
    // 401은 세션이 이미 만료된 경우(자동 로그인 실패 등) — 해제할 등록도 없으므로 조용히 넘어간다
    if (__DEV__ && e?.status !== 401) console.warn('푸시 토큰 해제 실패:', e?.message ?? e);
  }
}
