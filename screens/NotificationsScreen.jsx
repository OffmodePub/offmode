import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { W } from '../constants/warm';
import WarmText from '../components/WarmText';
import { RoomTopBar } from '../components/RoomBits';
import * as H from '../utils/haptics';

/**
 * Rooms v2 알림 센터 (Figma: Mission · Notifications).
 * 콕찌르기·리액션·피어확인·초대·미션도착·방완료 알림을 오늘/어제로 묶어 보여준다.
 * 백엔드 알림 피드 API는 아직 없어 Figma 샘플 데이터로 렌더한다(추후 API 연동 시 GROUPS만 교체).
 */

// 아이콘 서클 톤 (Figma: 0.14 tint)
const TONE_BG = {
  coral: 'rgba(232,81,58,0.14)',
  green: 'rgba(46,125,82,0.14)',
  brown: 'rgba(122,92,79,0.14)',
};
const UNREAD_BG = 'rgba(46,125,82,0.07)'; // 안 읽은 알림 행 배경

const GROUPS = [
  {
    label: '오늘',
    items: [
      { id: 't1', emoji: '🔥', tone: 'coral', name: '지민', message: '님이 회원님을 콕 찔렀어요', time: '5분 전', unread: true, action: 'nudgeBack' },
      { id: 't2', emoji: '👍', tone: 'green', name: '하준', message: '님이 회원님 인증에 반응했어요', time: '1시간 전', unread: true },
      { id: 't3', emoji: '🤝', tone: 'green', name: '민서', message: '님이 회원님 인증을 확인했어요', time: '3시간 전' },
      { id: 't4', emoji: '🌙', tone: 'brown', name: null, message: '오늘의 미션이 도착했어요', time: '오전 8:00' },
    ],
  },
  {
    label: '어제',
    items: [
      { id: 'y1', emoji: '📨', tone: 'coral', name: '책 읽는 밤', message: ' 방에 초대받았어요', time: '어제 21:30' },
      { id: 'y2', emoji: '🎉', tone: 'green', name: '우리 동네 갓생러', message: ' 방이 오늘 미션을 모두 완료했어요', time: '어제 20:10' },
    ],
  },
];

function NotiRow({ item, C, s }) {
  const { emoji, tone, name, message, time, unread, action } = item;
  return (
    <View style={[s.row, unread && { backgroundColor: UNREAD_BG }]}>
      <View style={[s.iconCircle, { backgroundColor: TONE_BG[tone] ?? TONE_BG.brown }]}>
        <WarmText size={19}>{emoji}</WarmText>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <WarmText v="body" size={14} color={C.textSub}>
          {name ? <WarmText v="body" size={14} color={C.text}>{name}</WarmText> : null}{message}
        </WarmText>
        <WarmText v="caption" size={12} color={C.textSub}>{time}</WarmText>
      </View>
      {action === 'nudgeBack' ? (
        <TouchableOpacity activeOpacity={0.8} onPress={() => H.tap()} style={[s.nudgeChip, { backgroundColor: C.coralFaint, borderColor: C.coralBorder }]}>
          <WarmText v="caption" size={12} color={C.coral}>나도 콕</WarmText>
        </TouchableOpacity>
      ) : unread ? (
        <View style={[s.unreadDot, { backgroundColor: C.green }]} />
      ) : null}
    </View>
  );
}

export default function NotificationsScreen({ onBack }) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);

  return (
    <View style={s.screen}>
      <RoomTopBar title="알림" onBack={onBack} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {GROUPS.map((group) => (
          <View key={group.label} style={s.group}>
            <WarmText v="label" size={12} color={C.textSub}>{group.label}</WarmText>
            <View style={s.card}>
              {group.items.map((item, i) => (
                <React.Fragment key={item.id}>
                  {i > 0 ? <View style={[s.divider, { backgroundColor: C.border }]} /> : null}
                  <NotiRow item={item} C={C} s={s} />
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.bg },
    content: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 40, gap: 18 },
    group: { gap: 8 },
    card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 16, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    divider: { height: 1, width: '100%' },
    nudgeChip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7 },
    unreadDot: { width: 8, height: 8, borderRadius: 4 },
  });
}
