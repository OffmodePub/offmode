import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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
