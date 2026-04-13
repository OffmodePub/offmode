import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Modal,
  TouchableOpacity, Switch, TextInput, Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../utils/useColors';
import { useTheme } from '../utils/ThemeContext';
import T from '../components/ThemedText';
import * as H from '../utils/haptics';
import { api } from '../utils/api';

const F = 'Kkukkukk';

const AVATARS = ['🏃','🚴','🧘','🏊','💪','🎯','🔥','⚡','🌙','🦁','🐺','🦊','📚','🎮','🌅','🎸'];

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
          <T v="section">{label}</T>
          {sub ? <T v="label">{sub}</T> : null}
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
      paddingHorizontal: 16, paddingVertical: 14,
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
      {title ? <T v="section" style={sec.title}>{title}</T> : null}
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

/* ── 프로필 편집 모달 ────────────────────────────────── */
function ProfileEditModal({ visible, profile, onSave, onClose }) {
  const C = useColors();
  const m = useMemo(() => makeModalStyles(C), [C]);
  const [name,   setName]   = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);

  const handleSave = () => {
    Keyboard.dismiss();
    H.success();
    onSave({ name: name.trim() || '오프모더', avatar });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={m.backdrop} activeOpacity={1} onPress={() => { Keyboard.dismiss(); onClose(); }} />
      <View style={m.sheet}>
        <View style={m.handle} />
        <T v="section" style={m.title}>프로필 편집</T>

        <View style={m.previewRow}>
          <LinearGradient colors={['#22c97a', '#1ab065']} style={m.previewAvatar}>
            <Text style={m.previewEmoji}>{avatar}</Text>
          </LinearGradient>
        </View>

        <T v="label" style={m.sectionLabel}>아바타 선택</T>
        <View style={m.avatarGrid}>
          {AVATARS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[m.avatarCell, avatar === emoji && m.avatarCellActive]}
              onPress={() => { H.tap(); setAvatar(emoji); }}
              activeOpacity={0.7}
            >
              <Text style={m.avatarEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <T v="label" style={m.sectionLabel}>닉네임</T>
        <View style={m.inputWrap}>
          <TextInput
            style={m.input}
            value={name}
            onChangeText={setName}
            placeholder="닉네임 입력"
            placeholderTextColor={C.textSub}
            maxLength={12}
          />
          <T v="caption" style={{ opacity: 0.4 }}>{name.length}/12</T>
        </View>

        <TouchableOpacity onPress={handleSave} activeOpacity={0.85}>
          <LinearGradient
            colors={['#26d67a', '#1ab065']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={m.saveBtn}
          >
            <T v="btn">저장하기</T>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function makeModalStyles(C) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet: {
      backgroundColor: C.surface,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      borderTopWidth: 1, borderColor: C.greenBorder,
      paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
    },
    handle: {
      alignSelf: 'center', width: 40, height: 4,
      borderRadius: 2, backgroundColor: C.border, marginBottom: 20,
    },
    title:       { textAlign: 'center', marginBottom: 20 },
    previewRow:  { alignItems: 'center', marginBottom: 20 },
    previewAvatar: {
      width: 72, height: 72, borderRadius: 36,
      alignItems: 'center', justifyContent: 'center',
    },
    previewEmoji: { fontSize: 36 },
    sectionLabel: { marginBottom: 10, opacity: 0.6, letterSpacing: 1 },
    avatarGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    avatarCell: {
      width: 48, height: 48, borderRadius: 12,
      backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarCellActive: { borderColor: C.green, backgroundColor: C.greenFaint },
    avatarEmoji: { fontSize: 24 },
    inputWrap: {
      backgroundColor: C.surface2, borderRadius: 12,
      borderWidth: 1, borderColor: C.border,
      paddingHorizontal: 14, paddingVertical: 10,
      flexDirection: 'row', alignItems: 'center', marginBottom: 24,
    },
    input:   { flex: 1, fontFamily: F, fontSize: 15, color: C.text },
    saveBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
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
  profile,
  onSaveProfile,
}) {
  const C = useColors();
  const { scheme, setScheme } = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);

  const pad = (n) => String(n).padStart(2, '0');
  const timeLabel = missionTime
    ? `${pad(missionTime.hour)}:${pad(missionTime.minute)}`
    : '08:00';

  const [haptic,      setHaptic]      = useState(H.isEnabled());
  const [sound,       setSound]       = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [userInfo,    setUserInfo]    = useState(null);
  const [mainBadge,   setMainBadge]   = useState(null);

  useEffect(() => {
    api.get('/api/users/me').then(setUserInfo).catch(() => {});
    api.get('/api/badges/me')
      .then(badges => setMainBadge(badges.find(b => b.earned) ?? null))
      .catch(() => {});
  }, []);

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
        <T v="section">설정</T>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* 프로필 카드 */}
        <LinearGradient
          colors={C.isDark
            ? ['rgba(34,201,122,0.08)', 'rgba(34,201,122,0.02)']
            : ['rgba(34,201,122,0.12)', 'rgba(34,201,122,0.04)']}
          style={s.profileCard}
        >
          <LinearGradient colors={['#22c97a', '#1ab065']} style={s.profileAvatar}>
            <Text style={s.profileEmoji}>{profile?.avatar ?? '🏃'}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <T v="title" size={17}>{profile?.name ?? '오프모더'}</T>
            <T v="sub" size={12} style={{ marginTop: 2 }}>
              {userInfo ? `Lv.${userInfo.level ?? 1}` : ''}
              {mainBadge ? `  ${mainBadge.name}` : ''}
            </T>
          </View>
          <TouchableOpacity
            style={s.editBadge}
            onPress={() => { H.tap(); setEditVisible(true); }}
            activeOpacity={0.7}
          >
            <T v="green" size={11}>편집</T>
          </TouchableOpacity>
        </LinearGradient>

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
            onPress={() => {}}
            last
          />
        </Section>

        <VersionFooter />
      </ScrollView>

      {/* 프로필 편집 모달 */}
      {profile && (
        <ProfileEditModal
          visible={editVisible}
          profile={profile}
          onSave={onSaveProfile}
          onClose={() => setEditVisible(false)}
        />
      )}
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
    profileCard: {
      marginHorizontal: 20, marginBottom: 24,
      borderRadius: 18, borderWidth: 1, borderColor: C.greenBorder,
      flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
    },
    profileAvatar: {
      width: 52, height: 52, borderRadius: 26,
      alignItems: 'center', justifyContent: 'center',
    },
    profileEmoji: { fontSize: 26 },
    editBadge: {
      backgroundColor: C.greenFaint, borderRadius: 8,
      borderWidth: 1, borderColor: C.greenBorder,
      paddingHorizontal: 10, paddingVertical: 5,
    },
  });
}
