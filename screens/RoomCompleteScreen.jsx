import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { W } from '../constants/warm';
import WarmText from '../components/WarmText';
import { MemberAvatar, GreenButton } from '../components/RoomBits';

export default function RoomCompleteScreen({ summary, onBack }) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);
  const members = summary?.members ?? [];
  const streak = summary?.streak ?? 0;

  return (
    <View style={s.screen}>
      <View style={s.body}>
        <View style={s.iconCircle}><WarmText size={60}>🎉</WarmText></View>
        <WarmText v="heading" size={24} style={{ marginTop: 20, textAlign: 'center' }}>오늘 미션 완료!</WarmText>
        <WarmText v="body" size={14} style={{ marginTop: 10, textAlign: 'center', lineHeight: 21 }}>
          {summary?.name ? `${summary.name} 멤버 모두가\n오늘의 미션을 인증했어요` : '멤버 모두가 오늘의 미션을 인증했어요'}
        </WarmText>

        <View style={s.avatarRow}>
          {members.slice(0, 5).map((m, i) => (
            <View key={m.memberId ?? i} style={[s.avatarWrap, i > 0 && { marginLeft: -8 }]}>
              <MemberAvatar avatarId={m.avatarId} size={44} borderColor="#ffffff" />
              <View style={s.check}><Ionicons name="checkmark" size={9} color="#fff" /></View>
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
        <GreenButton label="방으로 돌아가기" onPress={onBack} radius={14} />
      </View>

      <View style={s.confettiOverlay} pointerEvents="none">
        <LottieView
          source={require('../assets/Confetti.json')}
          autoPlay
          loop={false}
          style={s.confetti}
          resizeMode="cover"
        />
      </View>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.bg },
    body:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: C.greenFaint, alignItems: 'center', justifyContent: 'center' },
    avatarRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
    avatarWrap: { position: 'relative' },
    check: { position: 'absolute', bottom: -3, alignSelf: 'center', width: 15, height: 15, borderRadius: 7.5, backgroundColor: C.green, borderWidth: 2, borderColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
    streakBadge: { marginTop: 22, backgroundColor: C.coralFaint, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
    bottom: { paddingHorizontal: 20, paddingBottom: 32 },
    confettiOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 10, alignItems: 'center' },
    confetti: { width: '100%', aspectRatio: 940 / 752, marginTop: -40 },
  });
}
