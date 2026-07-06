import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
  Modal, TextInput, Keyboard, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../utils/useColors';
import { api } from '../utils/api';
import T from '../components/ThemedText';
import WarmText from '../components/WarmText';
import { W } from '../constants/warm';
import { getAvatarSource, getAvatarDefaultSource } from '../utils/avatars';
import * as H from '../utils/haptics';
import CharacterDecor from '../components/CharacterDecor';
import { PARTS, isPartUnlocked, getCharacterSource } from '../constants/parts';
import { usePagerBottomBarHeight } from '../components/PageIndicator';
import AvatarImage from '../components/AvatarImage';
import { pad } from '../utils/date';

/**
 * GET /api/v1/parts/me 응답을 정적 카탈로그(PARTS)와 key로 병합.
 * - image·이름·순서·임계값은 로컬 카탈로그에서, unlocked·placement 는 서버에서.
 * - 서버 응답이 없으면(fallback) 누적 인증 수 기준으로 해금 여부만 계산.
 */
function mergePartsState(partsRes, verifiedCount) {
  const byKey = {};
  if (Array.isArray(partsRes)) {
    for (const p of partsRes) if (p?.key) byKey[p.key] = p;
  }
  return PARTS.map((meta) => {
    const remote = byKey[meta.key];
    return {
      ...meta,
      unlocked: remote?.unlocked ?? isPartUnlocked(meta, verifiedCount),
      placement: remote?.placement ?? null,
    };
  });
}

/* ── 날짜 유틸 ─────────────────────────────────────────── */
function parseLocalDT(val) {
  if (!val) return null;
  if (Array.isArray(val)) {
    const [y, mo, d, h = 0, mi = 0] = val;
    return new Date(y, mo - 1, d, h, mi);
  }
  return new Date(val);
}

function ymd(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

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
  return `${dt.getFullYear()}.${pad(dt.getMonth() + 1)}.${pad(dt.getDate())} 합류`;
}

/** 인증 히스토리 → 주간 활동용 최소 형태 */
function toWeekItem(m) {
  const dt = parseLocalDT(m.assignedAt);
  if (!dt) return null;
  return { dt, verified: m.status === 'verified' };
}

/**
 * 이번 주 7일의 상태: done(완료) / missed(놓침) / future(예정·진행중·가입 전).
 * 가입 전 날짜와 인증 대기(pending) 날짜는 '놓침'으로 보지 않는다 — 실제로 놓친 과거 날만 X 표시.
 */
function computeWeekData(history, joinDate) {
  const monday = getMondayOfWeek(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const join = parseLocalDT(joinDate);
  if (join) join.setHours(0, 0, 0, 0);
  const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일'];
  return DAY_NAMES.map((day, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    d.setHours(0, 0, 0, 0);
    const key = ymd(d);
    const dayItems = history.filter(h => h?.dt && ymd(h.dt) === key);
    let status = 'future';
    if (dayItems.some(h => h.verified)) status = 'done';     // 인증 완료
    else if (d >= today) status = 'future';                  // 오늘/미래
    else if (join && d < join) status = 'future';            // 가입 전 → 중립
    else if (dayItems.length > 0) status = 'future';         // 미션은 있으나 인증 대기 → 중립(미실패)
    else status = 'missed';                                  // 과거 + 가입 후 + 기록 없음 → 놓침
    return { day, status };
  });
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
  // 아바타(이미지)는 회원가입 때 확정 — 편집에서는 변경할 수 없고 미리보기만 노출
  const avatarId = profile.avatar ?? '01';

  useEffect(() => {
    if (visible) {
      setName(profile.name ?? '오프모더');
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
          <AvatarImage source={getAvatarDefaultSource(avatarId)} width={80} height={80} />
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
  const pagerBottom = usePagerBottomBarHeight(); // 플로팅 인디케이터+인셋 높이
  const [userProfile, setUserProfile] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [weekItems, setWeekItems] = useState([]);
  const [parts, setParts] = useState([]);
  const [editVisible, setEditVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [u, hist, stats, partsRes] = await Promise.all([
        api.get('/api/v1/users/me'),
        api.get('/api/v1/missions/history'),
        api.get('/api/v1/users/me/stats'),
        api.get('/api/v1/parts/me').catch(() => null),
      ]);
      setUserProfile(u);
      setWeekItems(hist.map(toWeekItem).filter(Boolean));
      setUserStats(stats);
      setParts(mergePartsState(partsRes, stats?.totalVerified ?? 0));
    } catch (e) {
      console.warn('데이터 로딩 실패:', e);
    }
  }, []);

  const handleSaveLayout = useCallback(async (placements) => {
    try {
      const updated = await api.put('/api/v1/parts/layout', { placements });
      setParts(mergePartsState(updated, userStats?.totalVerified ?? 0));
      H.success();
    } catch (e) {
      Alert.alert('저장 실패', e.message);
    }
  }, [userStats]);

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

  const weekData = useMemo(() => computeWeekData(weekItems, userProfile?.createdAt), [weekItems, userProfile]);

  const avatarId = profile?.avatar ?? userProfile?.avatar ?? '01';
  const avatarSource = getAvatarSource(avatarId, currentMission?.status ?? null);

  // 좌우 스와이프 전환은 상위(App)의 페이지 페이저가 담당한다.

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
        contentContainerStyle={{ paddingBottom: 48 + pagerBottom }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={W.green} colors={[W.green]} />}
      >
        {/* 헤더 */}
        <View style={s.header}>
          <View style={s.avatarSection}>
            <View style={s.avatarWrap}>
              <AvatarImage source={avatarSource} width={72} height={72} />
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

        {/* 캐릭터 꾸미기 — 선택한 아바타와 동일 캐릭터의 몸통 사용 */}
        <CharacterDecor
          parts={parts}
          characterSource={getCharacterSource(avatarId)}
          onSaveLayout={handleSaveLayout}
        />
      </ScrollView>

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
    backgroundColor: W.neutralStrong, borderWidth: 1, borderColor: W.borderStrong,
    borderRadius: 15, paddingHorizontal: 8, paddingVertical: 3,
    height: 30, minWidth: 50, alignItems: 'center', justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    backgroundColor: W.bg, borderWidth: 1, borderColor: W.borderStrong,
    borderRadius: 14, paddingVertical: 14,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 3 },
  summaryDivider: { width: 1, height: 36, backgroundColor: W.border },

  /* 이번 주 활동 */
  weekWrap: { paddingHorizontal: 16, paddingBottom: 24 },
  weekCard: {
    backgroundColor: W.neutralSoft, borderWidth: 1, borderColor: W.borderStrong,
    borderRadius: 16, padding: 16, gap: 14,
  },
  weekHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  streakBadge: {
    // Figma 정확값 — 코랄 15%/30% 틴트 (토큰 없음, 하드코딩 허용)
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
