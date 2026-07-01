import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { W } from '../constants/warm';
import WarmText from '../components/WarmText';
import { RoomTopBar } from '../components/RoomBits';

/**
 * Rooms v2 방 리더보드 (Figma: Mission · Leaderboard).
 * 방 컨텍스트 pill + 내 연속 기록 hero + 이번 주 스트릭 랭킹.
 * 백엔드 스트릭/랭킹 API는 아직 없어 랭킹은 Figma 샘플 데이터로 렌더한다(추후 API 연동 시 RANKS만 교체).
 */

const GREEN_014 = 'rgba(46,125,82,0.14)';
const GREEN_010 = 'rgba(46,125,82,0.1)';
const GREEN_008 = 'rgba(46,125,82,0.08)';
const CORAL_014 = 'rgba(232,81,58,0.14)';
const BROWN_014 = 'rgba(122,92,79,0.14)';

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

const RANKS = [
  { rank: 1, avatar: '🦊', name: '나', streak: 12, me: true },
  { rank: 2, avatar: '🐨', name: '하준', streak: 9 },
  { rank: 3, avatar: '🐧', name: '지민', streak: 7 },
  { rank: 4, avatar: '🐰', name: '민서', streak: 5 },
  { rank: 5, avatar: '🐱', name: '서연', streak: 3 },
];

export default function LeaderboardScreen({ roomName = '우리 동네 갓생러', roomIcon = '🏃', onBack }) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);

  return (
    <View style={s.screen}>
      <RoomTopBar title="리더보드" onBack={onBack} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* 방 컨텍스트 + 기간 */}
        <View style={s.ctxRow}>
          <View style={s.ctxPill}>
            <View style={s.ctxIcon}><WarmText size={12}>{roomIcon}</WarmText></View>
            <WarmText size={13} color={C.green}>{roomName}</WarmText>
          </View>
          <WarmText size={13} color={C.textSub}>이번 주</WarmText>
        </View>

        {/* 내 연속 기록 hero */}
        <View style={s.hero}>
          <View style={s.heroIcon}><WarmText size={25}>🔥</WarmText></View>
          <View style={{ flex: 1, gap: 3 }}>
            <WarmText size={18}>12일 연속 인증 중!</WarmText>
            <WarmText size={13} color={C.textSub}>이번 주 7/7 인증 · 방 내 1위</WarmText>
          </View>
        </View>

        {/* 이번 주 랭킹 */}
        <View style={s.group}>
          <WarmText v="label" size={12} color={C.textSub}>이번 주 랭킹</WarmText>
          <View style={s.card}>
            {RANKS.map((r, i) => (
              <React.Fragment key={r.rank}>
                {i > 0 ? <View style={[s.divider, { backgroundColor: C.border }]} /> : null}
                <View style={[s.rankRow, r.me && { backgroundColor: GREEN_008 }]}>
                  <View style={s.rankBadge}>
                    {MEDALS[r.rank]
                      ? <WarmText size={15}>{MEDALS[r.rank]}</WarmText>
                      : <WarmText size={20} color={C.textSub}>{r.rank}</WarmText>}
                  </View>
                  <View style={[s.rankAvatar, { backgroundColor: r.me ? GREEN_014 : BROWN_014 }]}>
                    <WarmText size={18}>{r.avatar}</WarmText>
                  </View>
                  <WarmText v="body" size={15} color={r.me ? C.green : C.text} style={{ flex: 1 }}>{r.name}</WarmText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <WarmText size={13}>🔥</WarmText>
                    <WarmText size={14} color={r.me ? C.green : C.text}>{r.streak}일</WarmText>
                  </View>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.bg },
    content: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 40, gap: 18 },

    ctxRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    ctxPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GREEN_010, borderRadius: 14, paddingLeft: 10, paddingRight: 14, paddingVertical: 8 },
    ctxIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: GREEN_014, alignItems: 'center', justifyContent: 'center' },

    hero: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.greenFaint, borderWidth: 1, borderColor: C.greenBorder, borderRadius: 18, padding: 18 },
    heroIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: CORAL_014, alignItems: 'center', justifyContent: 'center' },

    group: { gap: 8 },
    card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 16, overflow: 'hidden' },
    divider: { height: 1, width: '100%' },
    rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 14, paddingRight: 16, paddingVertical: 13 },
    rankBadge: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
    rankAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  });
}
