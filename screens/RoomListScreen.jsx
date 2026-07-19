import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { W } from '../constants/warm';
import { api } from '../utils/api';
import WarmText from '../components/WarmText';
import * as H from '../utils/haptics';
import { RoomIcon, AvatarStack, ProgressBar, GreenButton, OutlineButton, SourceBadge } from '../components/RoomBits';
import { usePagerBottomBarHeight } from '../components/PageIndicator';

/* ── 방 카드 ───────────────────────────────────────────── */
function RoomCard({ room, solo, onPress }) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);
  const mission = room.todayMission;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[s.card, solo && s.cardSolo]}>
      <View style={s.cardTop}>
        <RoomIcon iconKey={room.iconKey} size={30} accent={solo} />
        <View style={{ flex: 1, gap: 3 }}>
          <View style={s.nameRow}>
            <WarmText v="section" size={16} numberOfLines={1} style={{ flexShrink: 1 }}>{room.name}</WarmText>
            {mission?.source ? <SourceBadge source={mission.source} /> : null}
          </View>
          <WarmText v="caption" color={C.text}>{solo ? '혼자 하는 방' : `멤버 ${room.memberCount}명`}</WarmText>
        </View>
        {!solo && room.members ? <AvatarStack members={room.members} /> : null}
      </View>

      <View style={[s.divider, solo && s.dividerSolo]} />

      {mission ? (
        <View style={s.missionRow}>
          <WarmText size={18}>{mission.icon}</WarmText>
          <WarmText v="body" size={14} numberOfLines={1} style={{ flex: 1 }}>{mission.title}</WarmText>
        </View>
      ) : (
        <View style={s.missionRow}>
          <WarmText size={18}>💤</WarmText>
          <WarmText v="sub" size={14} style={{ flex: 1 }}>아직 오늘 미션이 없어요</WarmText>
        </View>
      )}

      {solo && mission ? (
        <View style={{ marginTop: 10 }}>
          <WarmText v="caption" size={11} color={room.todayDone ? C.green : C.textSub}>
            {room.todayDone ? '✓ 오늘 미션 인증 완료' : '아직 인증 전이에요'}
          </WarmText>
        </View>
      ) : null}

      {!solo && mission ? (
        <View style={{ marginTop: 12 }}>
          <ProgressBar value={room.verifiedCount ?? 0} total={room.requiredCount ?? room.memberCount ?? 0} />
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

/* ── 빈 상태 ───────────────────────────────────────────── */
function EmptyState() {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Ionicons name="home-outline" size={36} color={C.green} />
      </View>
      <WarmText v="title" size={16} style={{ marginTop: 16 }}>아직 참여한 방이 없어요</WarmText>
      <WarmText v="sub" color={C.brown} style={{ textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
        첫 방을 만들거나 초대코드로 참여해{'\n'}오늘의 미션을 시작해보세요
      </WarmText>
    </View>
  );
}

/* 상단 배너 문구 — 일정 간격으로 순환 노출 */
const BANNER_PHRASES = [
  '📸  혼자 또는 친구와 미션을 인증해요',
  '🌿  오늘도 스크린 OFF, 일상 ON',
  '🚶  작은 미션 하나로 하루가 달라져요',
  '🔥  연속 인증으로 나만의 기록을 쌓아요',
  '👀  친구들의 인증을 구경하고 응원해요',
  '✨  매일 새로운 랜덤 미션이 기다려요',
  '☀️  지금, 화면 밖으로 한 걸음 나가볼까요?',
  '🤝  함께하면 미션이 더 즐거워져요',
];
const BANNER_INTERVAL_MS = 4000;

export default function RoomListScreen({ onOpenRoom, onCreate, onJoin, onOpenNotifications, version }) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);
  const pagerBottom = usePagerBottomBarHeight(); // 플로팅 인디케이터+인셋 높이

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // 상단 배너 문구 순환 (페이드 전환)
  const [bannerIdx, setBannerIdx] = useState(0);
  const bannerFade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(bannerFade, { toValue: 0, duration: 350, useNativeDriver: true }).start(() => {
        setBannerIdx(i => (i + 1) % BANNER_PHRASES.length);
        Animated.timing(bannerFade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
      });
    }, BANNER_INTERVAL_MS);
    return () => clearInterval(id);
  }, [bannerFade]);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.get('/api/v1/rooms');
      setData(res ?? { soloRoom: null, groupRooms: [] });
    } catch (e) {
      console.warn('방 목록 로딩 실패:', e);
      setError(e?.message || '방 목록을 불러오지 못했어요.');
    }
  }, []);

  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load, version]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const solo = data?.soloRoom ?? null;
  const groups = data?.groupRooms ?? [];
  const isEmpty = !solo && groups.length === 0;

  return (
    <View style={s.screen}>
      <ScrollView
        style={s.screen}
        contentContainerStyle={[s.content, { paddingBottom: 110 + pagerBottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.green} colors={[C.green]} />}
      >
        <View style={s.header}>
          <WarmText v="logo">OFFMODE</WarmText>
          <WarmText v="section" size={17} color={C.green} style={{ marginTop: 8 }}>스크린 OFF. 일상 ON.</WarmText>
          {/* TODO(알림): 백엔드 알림 피드 API 미구현 → 진입점 숨김. 알림 도메인(콕찌르기·리액션·피어확인·초대·방완료 적재 + GET /notifications + 읽음처리) 구현 후 벨 아이콘 복원. NotificationsScreen 은 현재 하드코딩 샘플.
          <TouchableOpacity
            style={s.bell}
            hitSlop={12}
            activeOpacity={0.7}
            onPress={() => { H.tap(); onOpenNotifications?.(); }}
          >
            <Ionicons name="notifications-outline" size={24} color={C.text} />
          </TouchableOpacity>
          */}
        </View>

        <View style={s.banner}>
          <Animated.View style={{ opacity: bannerFade }}>
            <WarmText v="body" size={14} color={C.text}>{BANNER_PHRASES[bannerIdx]}</WarmText>
          </Animated.View>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator color={C.green} /></View>
        ) : error ? (
          <View style={s.center}>
            <WarmText v="sub" style={{ textAlign: 'center', marginBottom: 12 }}>{error}</WarmText>
            <OutlineButton label="다시 시도하기" onPress={() => { setLoading(true); load().finally(() => setLoading(false)); }} />
          </View>
        ) : isEmpty ? (
          <EmptyState />
        ) : (
          <>
            {solo ? (
              <>
                <WarmText v="label" color={C.green} style={s.sectionLabel}>나의 방</WarmText>
                <RoomCard room={solo} solo onPress={() => { H.tap(); onOpenRoom?.(solo.id); }} />
              </>
            ) : null}

            <View style={s.sectionLabelRow}>
              <WarmText v="label">함께하는 방</WarmText>
              <WarmText v="caption" size={11} color={C.text}>{groups.length}개</WarmText>
            </View>
            {groups.length === 0 ? (
              <View style={s.emptyGroups}>
                <WarmText size={28} style={{ marginBottom: 6 }}>👥</WarmText>
                <WarmText v="sub" style={{ textAlign: 'center' }}>함께하는 방이 아직 없어요{'\n'}새 방을 만들어 친구를 초대해보세요</WarmText>
              </View>
            ) : (
              groups.map(r => <RoomCard key={r.id} room={r} onPress={() => { H.tap(); onOpenRoom?.(r.id); }} />)
            )}
          </>
        )}
      </ScrollView>

      <View style={[s.bottomBar, { bottom: pagerBottom }]}>
        <GreenButton label="새 방 만들기" ionicon="add" onPress={() => { H.tap(); onCreate?.(); }} style={{ flex: 1 }} />
        <OutlineButton label="초대코드로 참여하기" ionicon="link-outline" onPress={() => { H.tap(); onJoin?.(); }} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: C.bg },
    content: { paddingBottom: 110 },
    center:  { paddingVertical: 60, alignItems: 'center', justifyContent: 'center' },

    header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12 },
    bell:   { position: 'absolute', right: 20, top: 24, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    banner: { marginTop: 4, paddingVertical: 14, paddingHorizontal: 24, backgroundColor: C.neutralSoft, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.borderStrong },
    sectionLabel: { paddingHorizontal: 20, marginTop: 20, marginBottom: 10 },
    sectionLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 24, marginBottom: 10 },

    card:     { marginHorizontal: 20, marginBottom: 12, backgroundColor: C.neutralSoft, borderRadius: 20, borderWidth: 1, borderColor: C.borderStrong, padding: 16 },
    cardSolo: { backgroundColor: C.greenFaint, borderColor: C.greenBorder },
    cardTop:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
    nameRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
    divider:  { height: 1, backgroundColor: C.borderStrong, marginVertical: 12 },
    dividerSolo: { backgroundColor: C.greenBorder },
    missionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

    empty:     { alignItems: 'center', paddingVertical: 70, paddingHorizontal: 40 },
    emptyIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.greenFaint, alignItems: 'center', justifyContent: 'center' },
    emptyGroups: { marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.border, paddingVertical: 28, alignItems: 'center' },

    // bottom 위치는 호출부에서 플로팅 바텀 높이만큼 올려줌(인디케이터와 겹침 방지)
    // 배경 완전 투명 — 버튼 자체 배경만 보이고 컨텐츠가 그 주변으로 비침 (엣지-투-엣지)
    bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 16, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, backgroundColor: 'transparent' },
  });
}
