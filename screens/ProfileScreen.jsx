import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
  Modal, TextInput, Keyboard, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../utils/useColors';
import { api } from '../utils/api';
import T from '../components/ThemedText';
import WarmText from '../components/WarmText';
import { W } from '../constants/warm';
import { AVATAR_IDS, getAvatarSource, getAvatarDefaultSource } from '../utils/avatars';
import * as H from '../utils/haptics';
import CharacterDecor from '../components/CharacterDecor';
import { buildPartsState } from '../constants/parts';

/* ── 날짜 유틸 ─────────────────────────────────────────── */
function parseLocalDT(val) {
  if (!val) return null;
  if (Array.isArray(val)) {
    const [y, mo, d, h = 0, mi = 0] = val;
    return new Date(y, mo - 1, d, h, mi);
  }
  return new Date(val);
}

function pad2(n) { return String(n).padStart(2, '0'); }
function ymd(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }

function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatJoinDate(val) {
  const dt = parseLocalDT(val);
  if (!dt) return '';
  return `${dt.getFullYear()}.${pad2(dt.getMonth() + 1)}.${pad2(dt.getDate())} 합류`;
}

/** 인증 히스토리 → 주간 활동용 최소 형태 */
function toWeekItem(m) {
  const dt = parseLocalDT(m.assignedAt);
  if (!dt) return null;
  return { dt, verified: m.status === 'verified' };
}

/** 이번 주 7일의 상태: done(완료) / missed(놓침) / future(예정) */
function computeWeekData(history) {
  const monday = getMondayOfWeek(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일'];
  return DAY_NAMES.map((day, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    d.setHours(0, 0, 0, 0);
    const key = ymd(d);
    const done = history.some(h => h?.dt && ymd(h.dt) === key && h.verified);
    let status = 'future';
    if (done) status = 'done';
    else if (d < today) status = 'missed';
    return { day, status };
  });
}

/* ── SVG 아바타 렌더러 ───────────────────────────────── */
function AvatarSvg({ source: SvgComponent, width = 72, height = 72 }) {
  if (!SvgComponent) return <View style={{ width, height }} />;
  return <SvgComponent width={width} height={height} />;
}

/* ── 이번 주 활동 (웜) ───────────────────────────────── */
function WeeklyActivity({ weekData }) {
  const doneCount = weekData.filter(d => d.status === 'done').length;
  return (
    <View style={s.weekWrap}>
      <View style={s.weekCard}>
        <View style={s.weekHeader}>
          <WarmText v="section" size={17}>이번 주 활동</WarmText>
          <View style={s.streakBadge}>
            <WarmText size={12} color={W.coral}>🔥 {doneCount}일 완료</WarmText>
          </View>
        </View>
        <View style={s.weekRow}>
          {weekData.map((d, i) => {
            const dayColor =
              d.status === 'done' ? W.green : d.status === 'missed' ? W.coral : W.textSub;
            return (
              <View key={i} style={s.dayCol}>
                <View style={[s.dayBox, s[`dayBox_${d.status}`]]}>
                  {d.status === 'done' && <WarmText size={14} color={W.green}>V</WarmText>}
                  {d.status === 'missed' && <WarmText size={14} color={W.coral}>X</WarmText>}
                </View>
                <WarmText size={12} color={dayColor}>{d.day}</WarmText>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/* ── 프로필 편집 모달 ────────────────────────────────── */
function ProfileEditModal({ visible, profile, onSave, onClose }) {
  const C = useColors();
  const m = useMemo(() => makeEditModalStyles(C), [C]);
  const [name, setName] = useState('');
  const [avatarId, setAvatarId] = useState('01');

  useEffect(() => {
    if (visible) {
      setName(profile.name ?? '오프모더');
      setAvatarId(profile.avatar ?? '01');
    }
  }, [visible]);

  const handleSave = () => {
    Keyboard.dismiss();
    H.success();
    onSave({ name: name.trim() || '오프모더', avatar: avatarId });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={m.backdrop} activeOpacity={1} onPress={() => { Keyboard.dismiss(); onClose(); }} />
      <View style={m.sheet}>
        <View style={m.handle} />
        <T v="section" style={m.title}>프로필 편집</T>
        <View style={m.previewRow}>
          <AvatarSvg source={getAvatarDefaultSource(avatarId)} width={80} height={80} />
        </View>
        <T v="label" style={m.sectionLabel}>아바타 선택</T>
        <View style={m.avatarGrid}>
          {AVATAR_IDS.map((id) => (
            <TouchableOpacity
              key={id}
              style={[m.avatarCell, avatarId === id && m.avatarCellActive]}
              onPress={() => { H.tap(); setAvatarId(id); }}
              activeOpacity={0.7}
            >
              <AvatarSvg source={getAvatarDefaultSource(id)} width={52} height={52} />
              {avatarId === id && (
                <View style={m.avatarCheck}><T v="green" size={10}>✓</T></View>
              )}
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
          <LinearGradient colors={['#26d67a', '#1ab065']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={m.saveBtn}>
            <T v="btn">저장하기</T>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default function ProfileScreen({ profile, onSaveProfile, currentMission }) {
  const [userProfile, setUserProfile] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [weekItems, setWeekItems] = useState([]);
  const [editVisible, setEditVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [u, hist, stats] = await Promise.all([
        api.get('/api/v1/users/me'),
        api.get('/api/v1/missions/history'),
        api.get('/api/v1/users/me/stats'),
      ]);
      setUserProfile(u);
      setWeekItems(hist.map(toWeekItem).filter(Boolean));
      setUserStats(stats);
    } catch (e) {
      console.warn('데이터 로딩 실패:', e);
    }
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleSaveProfile = (updated) => {
    onSaveProfile?.(updated);
    api.put('/api/v1/users/me', { name: updated.name, avatar: updated.avatar })
      .catch(e => console.warn('프로필 저장 실패:', e));
  };

  const totalMissions = userStats?.totalMissions ?? 0;
  const verifiedCount = userStats?.totalVerified ?? 0;
  const streakDays = userStats?.streak ?? 0;
  const completionRate = totalMissions > 0 ? Math.round((verifiedCount / totalMissions) * 100) : 0;

  const weekData = useMemo(() => computeWeekData(weekItems), [weekItems]);
  const decorParts = useMemo(() => buildPartsState(verifiedCount, null), [verifiedCount]);

  const avatarId = profile?.avatar ?? userProfile?.avatar ?? '01';
  const avatarSource = getAvatarSource(avatarId, currentMission?.status ?? null);

  if (loading) {
    return (
      <View style={[s.screen, s.center]}>
        <ActivityIndicator color={W.green} />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={W.green} colors={[W.green]} />}
      >
        {/* 헤더 */}
        <View style={s.header}>
          <View style={s.avatarSection}>
            <View style={s.avatarWrap}>
              <AvatarSvg source={avatarSource} width={72} height={72} />
            </View>
            <View style={s.nameBlock}>
              <WarmText size={22}>{profile?.name ?? userProfile?.name ?? '오프모더'}</WarmText>
              <WarmText size={12} color={W.textSub} style={{ opacity: 0.6 }}>
                {formatJoinDate(userProfile?.createdAt)}
              </WarmText>
            </View>
            <TouchableOpacity
              style={s.editBadge}
              onPress={() => { H.tap(); setEditVisible(true); }}
              activeOpacity={0.7}
            >
              <WarmText size={11} color={W.text}>편집</WarmText>
            </TouchableOpacity>
          </View>

          <View style={s.summaryRow}>
            <View style={s.summaryItem}>
              <WarmText size={25} color={W.green}>{totalMissions}</WarmText>
              <WarmText size={13} color={W.textSub}>총 미션</WarmText>
            </View>
            <View style={s.summaryDivider} />
            <View style={s.summaryItem}>
              <WarmText size={25} color={W.green}>{streakDays}일</WarmText>
              <WarmText size={13} color={W.textSub}>연속 달성</WarmText>
            </View>
            <View style={s.summaryDivider} />
            <View style={s.summaryItem}>
              <WarmText size={25} color={W.green}>{completionRate}%</WarmText>
              <WarmText size={13} color={W.textSub}>인증 완료율</WarmText>
            </View>
          </View>
        </View>

        {/* 이번 주 활동 */}
        <WeeklyActivity weekData={weekData} />

        {/* 캐릭터 꾸미기 */}
        <CharacterDecor parts={decorParts} />
      </ScrollView>

      {/* 하단 바 (고정) — 시안 364:244 */}
      <View style={s.bottomBar}>
        <View style={[s.dot, s.dotActive]} />
        <View style={s.dot} />
        <View style={s.dot} />
      </View>

      {profile && (
        <ProfileEditModal
          visible={editVisible}
          profile={profile}
          onSave={handleSaveProfile}
          onClose={() => setEditVisible(false)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: W.bg },
  center: { justifyContent: 'center', alignItems: 'center' },

  /* 헤더 */
  header: { backgroundColor: W.bg, paddingTop: 36, paddingBottom: 24, paddingHorizontal: 20, gap: 24 },
  avatarSection: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  avatarWrap: {
    width: 72, height: 72, borderRadius: 36, overflow: 'hidden',
    borderWidth: 1, borderColor: W.borderStrong, backgroundColor: W.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  nameBlock: { gap: 5 },
  editBadge: {
    backgroundColor: W.neutral, borderWidth: 1, borderColor: W.borderStrong,
    borderRadius: 15, paddingHorizontal: 8, paddingVertical: 3,
    height: 30, minWidth: 50, alignItems: 'center', justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    backgroundColor: W.bg, borderWidth: 1, borderColor: W.borderStrong,
    borderRadius: 14, paddingVertical: 14,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 3 },
  summaryDivider: { width: 1, height: 36, backgroundColor: '#ede8ff' },

  /* 이번 주 활동 */
  weekWrap: { paddingHorizontal: 16, paddingBottom: 24 },
  weekCard: {
    backgroundColor: 'rgba(168,149,138,0.2)', borderWidth: 1, borderColor: W.borderStrong,
    borderRadius: 16, padding: 16, gap: 14,
  },
  weekHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  streakBadge: {
    backgroundColor: 'rgba(232,81,58,0.15)', borderWidth: 1, borderColor: 'rgba(232,81,58,0.3)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  weekRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 7 },
  dayBox: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  dayBox_done: { backgroundColor: W.greenFaint, borderColor: W.greenBorder },
  dayBox_missed: { backgroundColor: W.coralFaint, borderColor: W.coralBorder },
  dayBox_future: { backgroundColor: 'transparent', borderColor: W.borderStrong, borderStyle: 'dashed' },

  /* 하단 바 (고정) */
  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 33,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    backgroundColor: W.bg,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: W.border },
  dotActive: { width: 20, backgroundColor: W.green },
});

function makeEditModalStyles(C) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet: {
      backgroundColor: C.surface,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      borderTopWidth: 1, borderColor: C.greenBorder,
      paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
    },
    handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, marginBottom: 20 },
    title: { textAlign: 'center', marginBottom: 16 },
    previewRow: { alignItems: 'center', marginBottom: 20 },
    sectionLabel: { marginBottom: 10, opacity: 0.6, letterSpacing: 1 },
    avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    avatarCell: {
      width: 60, height: 60, borderRadius: 14,
      backgroundColor: C.surface2, borderWidth: 1.5, borderColor: C.border,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarCellActive: { borderColor: C.green, backgroundColor: C.greenFaint },
    avatarCheck: {
      position: 'absolute', bottom: 4, right: 4,
      backgroundColor: C.green, borderRadius: 6, width: 16, height: 16,
      alignItems: 'center', justifyContent: 'center',
    },
    inputWrap: {
      backgroundColor: C.surface2, borderRadius: 12,
      borderWidth: 1, borderColor: C.border,
      paddingHorizontal: 14, paddingVertical: 10,
      flexDirection: 'row', alignItems: 'center', marginBottom: 24,
    },
    input: { flex: 1, fontFamily: 'Kkukkukk', fontSize: 15, color: C.text },
    saveBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  });
}
