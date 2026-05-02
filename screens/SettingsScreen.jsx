import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Alert,
} from 'react-native';
import { useColors } from '../utils/useColors';
import { useTheme } from '../utils/ThemeContext';
import T from '../components/ThemedText';
import * as H from '../utils/haptics';

/* ── 토글 스위치 ─────────────────────────────────────── */
function OffSwitch({ value, onValueChange }) {
  return (
    <Switch
      value={value}
      onValueChange={(v) => { H.tap(); onValueChange(v); }}
      trackColor={{ false: '#3a3a4a', true: '#22c97a' }}
    />
  );
}

/* ── 설정 행 ─────────────────────────────────────────── */
function SettingRow({ icon, label, sub, right, onPress, last = false }) {
  const C = useColors();
  const row = useMemo(() => makeRowStyles(C), [C]);
  return (
    <TouchableOpacity
      style={[row.wrap, last && row.last]}
      onPress={onPress ? () => { H.tap(); onPress(); } : undefined}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={row.left}>
        <Text style={row.icon}>{icon}</Text>
        <View style={{ gap: 6 }}>
          <T v="section" style={{ fontSize: 16 }}>{label}</T>
          {sub ? <T v="label" style={{ fontSize: 14}}>{sub}</T> : null}
        </View>
      </View>
      <View style={row.right}>{right}</View>
    </TouchableOpacity>
  );
}

function makeRowStyles(C) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 16,
      borderBottomWidth: 1, borderBottomColor: C.border,
    },
    last:  { borderBottomWidth: 0 },
    left:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    right: { alignItems: 'flex-end' },
    icon:  { fontSize: 22, width: 28, textAlign: 'center' },
  });
}

/* ── 섹션 카드 ───────────────────────────────────────── */
function Section({ title, children }) {
  const C = useColors();
  const sec = useMemo(() => makeSecStyles(C), [C]);
  return (
    <View style={sec.wrap}>
      {title ? (
        <T v="section" style={[sec.title, { fontSize: 16 }]}>
          {title}
        </T>
      ) : null}
      <View style={sec.card}>{children}</View>
    </View>
  );
}

function makeSecStyles(C) {
  return StyleSheet.create({
    wrap:  { marginHorizontal: 20, marginBottom: 20 },
    title: { marginBottom: 15, marginLeft: 4, opacity: 0.6, letterSpacing: 1 },
    card:  { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  });
}

/* ── 버전 푸터 ───────────────────────────────────────── */
function VersionFooter() {
  return (
    <View style={ver.wrap}>
      <T v="logo" size={20}>OFFMODE</T>
      <T v="caption" style={{ marginTop: 4, opacity: 0.4 }}>v1.0.0  •  Made with 🌙</T>
    </View>
  );
}

const ver = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 32, opacity: 0.6, },
});

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
  const C = useColors();
  const { scheme, setScheme } = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);

  const pad = (n) => String(n).padStart(2, '0');
  const timeLabel = missionTime
    ? `${pad(missionTime.hour)}:${pad(missionTime.minute)}`
    : '08:00';

  const [haptic, setHaptic] = useState(H.isEnabled());
  const [sound,  setSound]  = useState(false);

  const handleHapticToggle = (v) => {
    H.setEnabled(v);
    setHaptic(v);
    if (v) H.tap();
  };

  return (
    <View style={s.screen}>
      {/* 헤더 */}
      <View style={s.header}>
        {onBack ? (
          <TouchableOpacity style={s.backBtn} onPress={() => { H.tap(); onBack(); }} activeOpacity={0.7}>
            <Text style={s.backIcon}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <T v="title">설정</T>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* 미션 */}
        <Section title="미션">
          <SettingRow
            icon="🕐"
            label="알림 시간"
            sub="이 시간에 미션이 도착해요"
            right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <T v="green" size={15}>{timeLabel}</T>
                <T v="sub">›</T>
              </View>
            }
            onPress={onOpenTimeSettings}
          />
          <SettingRow
            icon="🎰"
            label="시간되면 자동으로 돌리기"
            sub="설정 시간에 룰렛 자동 시작"
            right={
              <OffSwitch
                value={autoRoulette}
                onValueChange={onSetAutoRoulette}
              />
            }
            last
          />
        </Section>

        {/* 알림 — 푸시 알림은 미구현으로 주석 처리 */}
        {/*
        <Section title="알림">
          <SettingRow
            icon="🔔"
            label="푸시 알림"
            sub="미션 도착 알림 받기"
            right={<OffSwitch value={pushNotif} onValueChange={setPushNotif} />}
          />
          <SettingRow
            icon="⏰"
            label="일일 리마인더"
            sub="미완료 미션 저녁 알림"
            right={<OffSwitch value={reminder} onValueChange={setReminder} />}
            last
          />
        </Section>
        */}

        {/* 앱 */}
        <Section title="앱">
          <SettingRow
            icon="🌙"
            label="다크 모드"
            right={
              <OffSwitch
                value={scheme === 'dark'}
                onValueChange={(v) => setScheme(v ? 'dark' : 'light')}
              />
            }
          />
          <SettingRow
            icon="📳"
            label="햅틱 피드백"
            right={<OffSwitch value={haptic} onValueChange={handleHapticToggle} />}
          />
          <SettingRow
            icon="🔊"
            label="효과음"
            right={<OffSwitch value={sound} onValueChange={setSound} />}
            last
          />
        </Section>

        {/* 정보 */}
        <Section title="정보">
          <SettingRow
            icon="🛡️"
            label="개인정보 처리방침"
            right={<T v="sub">›</T>}
            onPress={() => {}}
          />
          <SettingRow
            icon="💬"
            label="문의하기"
            right={<T v="sub">›</T>}
            onPress={() => {}}
          />
          <SettingRow
            icon="⭐"
            label="앱 평가하기"
            right={<T v="sub">›</T>}
            onPress={() => {}}
            last
          />
        </Section>

        {/* 계정 */}
        <Section title="">
          <SettingRow
            icon="🚪"
            label="로그아웃"
            right={null}
            onPress={onLogout}
          />
          <SettingRow
            icon="⚠️"
            label="회원 탈퇴"
            right={null}
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

        <VersionFooter />
      </ScrollView>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.bg, paddingBottom: 40 },
    header: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
      alignItems: 'center', justifyContent: 'center',
    },
    backIcon: { fontSize: 20, color: C.text },
    content:  { paddingBottom: 40 },
  });
}
