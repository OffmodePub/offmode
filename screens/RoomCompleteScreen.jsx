import React, { useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { W } from '../constants/warm';
import WarmText from '../components/WarmText';
import { MemberAvatar, GreenButton } from '../components/RoomBits';

// 웜 팔레트 3색 컨페티 (그린 · 코랄 · 브라운)
const CONFETTI = [
  { left: '12%', color: W.green, delay: 0 },
  { left: '24%', color: W.coral, delay: 120 },
  { left: '38%', color: W.brown, delay: 60 },
  { left: '52%', color: W.green, delay: 200 },
  { left: '66%', color: W.coral, delay: 90 },
  { left: '78%', color: W.brown, delay: 160 },
  { left: '88%', color: W.green, delay: 40 },
  { left: '18%', color: W.coral, delay: 240 },
  { left: '60%', color: W.brown, delay: 300 },
  { left: '44%', color: W.green, delay: 180 },
];

function ConfettiDot({ left, color, delay }) {
  const fall = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(fall, { toValue: 1, duration: 2600, useNativeDriver: true }),
      ]),
    ).start();
  }, [fall, delay]);
  const translateY = fall.interpolate({ inputRange: [0, 1], outputRange: [-20, 380] });
  const opacity = fall.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] });
  return (
    <Animated.View style={[confettiBase.dot, { left, backgroundColor: color, transform: [{ translateY }], opacity }]} />
  );
}

const confettiBase = StyleSheet.create({
  dot: { position: 'absolute', top: 40, width: 8, height: 14, borderRadius: 2 },
});

export default function RoomCompleteScreen({ summary, onBack }) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);
  const members = summary?.members ?? [];
  const streak = summary?.streak ?? 0;

  return (
    <View style={s.screen}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {CONFETTI.map((c, i) => <ConfettiDot key={i} {...c} />)}
      </View>

      <View style={s.body}>
        <View style={s.iconCircle}><WarmText size={48}>🎉</WarmText></View>
        <WarmText v="heading" size={26} style={{ marginTop: 20, textAlign: 'center' }}>오늘 미션 완료!</WarmText>
        <WarmText v="sub" style={{ marginTop: 10, textAlign: 'center', lineHeight: 20 }}>
          {summary?.name ? `${summary.name} 멤버 모두가\n오늘의 미션을 인증했어요` : '멤버 모두가 오늘의 미션을 인증했어요'}
        </WarmText>

        <View style={s.avatarRow}>
          {members.slice(0, 5).map((m, i) => (
            <View key={m.memberId ?? i} style={s.avatarWrap}>
              <MemberAvatar avatarId={m.avatarId} size={48} />
              <View style={s.check}><Ionicons name="checkmark" size={11} color="#fff" /></View>
            </View>
          ))}
        </View>

        {streak > 0 ? (
          <View style={s.streakBadge}>
            <WarmText v="caption" size={13} color={C.coral}>🔥 {streak}일 연속 달성 중</WarmText>
          </View>
        ) : null}
      </View>

      <View style={s.bottom}>
        <GreenButton label="방으로 돌아가기" onPress={onBack} />
      </View>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.bg },
    body:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
    avatarRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
    avatarWrap: { position: 'relative' },
    check: { position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: C.green, borderWidth: 2, borderColor: C.bg, alignItems: 'center', justifyContent: 'center' },
    streakBadge: { marginTop: 22, backgroundColor: C.coralFaint, borderWidth: 1, borderColor: C.coralBorder, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8 },
    bottom: { paddingHorizontal: 20, paddingBottom: 32 },
  });
}
