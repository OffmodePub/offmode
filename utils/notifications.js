import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// 매일 설정한 시간에 반복 알림 예약 (기존 미션 알림 교체)
export async function scheduleMissionNotification(hour, minute) {
  await cancelMissionNotification();

  const granted = await requestNotificationPermission();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-mission',
    content: {
      title: '🎯 오늘의 미션 도착!',
      body: '지금 바로 확인하고 갓생을 시작해봐요 🔥',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelMissionNotification() {
  await Notifications.cancelScheduledNotificationAsync('daily-mission');
}
