import React, { useState, useMemo, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { W } from '../constants/warm';
import WarmText from '../components/WarmText';
import * as H from '../utils/haptics';
import {
  requestNotificationPermission,
  scheduleMissionNotification, cancelMissionNotification,
  scheduleReminderNotification, cancelReminderNotification,
} from '../utils/notifications';

const openLink = (url) =>
  Linking.openURL(url).catch(() =>
    Alert.alert('오류', '페이지를 열 수 없어요. 잠시 후 다시 시도해주세요.')
  );

/* ── 웜 토글 (Figma 46×26 pill) ──────────────────────── */
function WarmToggle({ value, onValueChange }) {
  const C = W;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => { H.tap(); onValueChange(!value); }}
      style={[
        toggleStyles.track,
        value
          ? { backgroundColor: C.green, alignItems: 'flex-end' }
          : { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, alignItems: 'flex-start' },
      ]}
    >
      <View style={toggleStyles.knob} />
    </TouchableOpacity>
  );
}

const toggleStyles = StyleSheet.create({
  track: { width: 46, height: 26, borderRadius: 13, padding: 2, justifyContent: 'center' },
  knob:  { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
});

/* ── 설정 행 ─────────────────────────────────────────── */
function SettingRow({ icon, label, sub, right, onPress, danger = false, last = false }) {
  const C = W;
  const row = useMemo(() => makeRowStyles(C), [C]);
  return (
    <TouchableOpacity
      style={[row.wrap, !last && row.divider]}
      onPress={onPress ? () => { H.tap(); onPress(); } : undefined}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={row.left}>
        <WarmText size={18}>{icon}</WarmText>
        <View style={{ gap: 2 }}>
          <WarmText v="body" size={15} color={danger ? C.coral : C.text}>{label}</WarmText>
          {sub ? <WarmText v="caption" size={12} color={C.textSub}>{sub}</WarmText> : null}
        </View>
      </View>
      <View style={row.right}>{right}</View>
    </TouchableOpacity>
  );
}

function makeRowStyles(C) {
  return StyleSheet.create({
    wrap:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
    divider: { borderBottomWidth: 1, borderBottomColor: C.border },
    left:    { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    right:   { alignItems: 'flex-end' },
  });
}

/* ── 섹션 카드 ───────────────────────────────────────── */
function Section({ title, children }) {
  const C = W;
  const sec = useMemo(() => makeSecStyles(C), [C]);
  return (
    <View style={sec.wrap}>
      {title ? <WarmText v="label" size={12} color={C.textSub}>{title}</WarmText> : null}
      <View style={sec.card}>{children}</View>
    </View>
  );
}

function makeSecStyles(C) {
  return StyleSheet.create({
    wrap: { gap: 8 },
    card: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  });
}

const Chevron = () => <WarmText size={16} color={W.textSub}>›</WarmText>;

/* ── 메인 설정 화면 ──────────────────────────────────── */
export default function SettingsScreen({
  onBack,
  onOpenTimeSettings,
  missionTime,
  autoRoulette,
  onSetAutoRoulette,
  onLogout,
  onDeleteAccount,
}) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);

  const pad = (n) => String(n).padStart(2, '0');
  const { hour = 8, minute = 0 } = missionTime ?? {};
  const timeLabel = `${hour < 12 ? '오전' : '오후'} ${hour % 12 === 0 ? 12 : hour % 12}:${pad(minute)}`;

  const [pushNotif, setPushNotif] = useState(false);
  const [reminder,  setReminder]  = useState(false);
  const [haptic,    setHaptic]    = useState(H.isEnabled());
  const [sound,     setSound]     = useState(false);

  useEffect(() => {
    (async () => {
      const pn = await SecureStore.getItemAsync('notif_push');
      const rm = await SecureStore.getItemAsync('notif_reminder');
      const hp = await SecureStore.getItemAsync('haptic');
      const sd = await SecureStore.getItemAsync('sound');
      if (pn !== null) setPushNotif(pn === 'true');
      if (rm !== null) setReminder(rm === 'true');
      if (hp !== null) { const on = hp === 'true'; setHaptic(on); H.setEnabled(on); }
      if (sd !== null) setSound(sd === 'true');
    })();
  }, []);

  const handlePushNotif = async (v) => {
    if (v) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          '알림 권한 필요',
          '설정 > offmode > 알림에서 권한을 허용해주세요.',
          [
            { text: '취소', style: 'cancel' },
            { text: '설정 열기', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
      const time = missionTime ?? { hour: 8, minute: 0 };
      await scheduleMissionNotification(time.hour, time.minute);
    } else {
      await cancelMissionNotification();
    }
    setPushNotif(v);
    await SecureStore.setItemAsync('notif_push', String(v));
  };

  const handleReminder = async (v) => {
    if (v) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          '알림 권한 필요',
          '설정 > offmode > 알림에서 권한을 허용해주세요.',
          [
            { text: '취소', style: 'cancel' },
            { text: '설정 열기', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
      await scheduleReminderNotification();
    } else {
      await cancelReminderNotification();
    }
    setReminder(v);
    await SecureStore.setItemAsync('notif_reminder', String(v));
  };

  const handleHaptic = (v) => {
    H.setEnabled(v);
    setHaptic(v);
    if (v) H.tap();
    SecureStore.setItemAsync('haptic', String(v));
  };

  const handleSound = (v) => {
    setSound(v);
    SecureStore.setItemAsync('sound', String(v));
  };

  return (
    <View style={s.screen}>
      {/* 헤더 */}
      <View style={s.header}>
        {onBack ? (
          <TouchableOpacity style={s.side} onPress={() => { H.tap(); onBack(); }} hitSlop={12} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={C.text} />
          </TouchableOpacity>
        ) : (
          <View style={s.side} />
        )}
        <WarmText v="body" size={18}>설정</WarmText>
        <View style={s.side} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* 미션 */}
        <Section title="미션">
          <SettingRow
            icon="⏰"
            label="알림 시간"
            right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <WarmText size={14} color={C.green}>{timeLabel}</WarmText>
                <Chevron />
              </View>
            }
            onPress={onOpenTimeSettings}
          />
          <SettingRow
            icon="🎲"
            label="시간되면 자동으로 돌리기"
            sub="설정 시간에 룰렛 자동 시작"
            right={<WarmToggle value={autoRoulette} onValueChange={onSetAutoRoulette} />}
            last
          />
        </Section>

        {/* 알림 */}
        <Section title="알림">
          <SettingRow
            icon="🔔"
            label="푸시 알림"
            sub="미션 도착 알림 받기"
            right={<WarmToggle value={pushNotif} onValueChange={handlePushNotif} />}
          />
          <SettingRow
            icon="🌙"
            label="일일 리마인더"
            sub="미완료 미션 저녁 알림 (21:00)"
            right={<WarmToggle value={reminder} onValueChange={handleReminder} />}
            last
          />
        </Section>

        {/* 앱 */}
        <Section title="앱">
          <SettingRow
            icon="📳"
            label="햅틱 피드백"
            right={<WarmToggle value={haptic} onValueChange={handleHaptic} />}
          />
          <SettingRow
            icon="🔈"
            label="효과음"
            right={<WarmToggle value={sound} onValueChange={handleSound} />}
            last
          />
        </Section>

        {/* 정보 */}
        <Section title="정보">
          <SettingRow
            icon="🔒"
            label="개인정보 처리방침"
            right={<Chevron />}
            onPress={() => openLink('https://fuchsia-belief-040.notion.site/OFFMODE-34309a0b0e3e809b965bd62530627431')}
          />
          <SettingRow
            icon="📄"
            label="서비스 이용약관"
            right={<Chevron />}
            onPress={() => openLink('https://fuchsia-belief-040.notion.site/35f09a0b0e3e80ffa48fde51b2de125b')}
          />
          <SettingRow
            icon="✉️"
            label="문의하기"
            right={<Chevron />}
            onPress={() => openLink('https://fuchsia-belief-040.notion.site/Off-Mode-35f09a0b0e3e80af81a8ce27d686fd7d')}
          />
          <SettingRow
            icon="⭐"
            label="앱 평가하기"
            right={<Chevron />}
            onPress={() => {}}
            last
          />
        </Section>

        {/* 계정 */}
        <Section title="계정">
          <SettingRow
            icon="🚪"
            label="로그아웃"
            right={<Chevron />}
            onPress={onLogout}
          />
          <SettingRow
            icon="⚠️"
            label="회원 탈퇴"
            danger
            right={<Chevron />}
            onPress={() => {
              Alert.alert(
                '회원 탈퇴',
                '탈퇴하면 모든 미션 기록과 배지가 삭제됩니다.\n정말 탈퇴하시겠어요?',
                [
                  { text: '취소', style: 'cancel' },
                  { text: '탈퇴', style: 'destructive', onPress: onDeleteAccount },
                ],
              );
            }}
            last
          />
        </Section>

        {/* 버전 푸터 */}
        <View style={s.footer}>
          <WarmText size={20} color={C.green}>OFFMODE</WarmText>
          <WarmText v="caption" size={11} color={C.textSub} style={{ marginTop: 4, opacity: 0.6 }}>v1.0.0  •  Made with 🌙</WarmText>
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: C.bg },
    header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 16, paddingBottom: 12 },
    side:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    content: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 40, gap: 22 },
    footer:  { alignItems: 'center', paddingTop: 16 },
  });
}
