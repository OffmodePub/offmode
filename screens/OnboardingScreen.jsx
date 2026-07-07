import React, { useMemo, useRef, useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity, ScrollView, Image, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { W } from '../constants/warm';
import WarmText from '../components/WarmText';
import { MemberAvatar } from '../components/RoomBits';
import * as H from '../utils/haptics';

/**
 * Rooms v2 온보딩 캐러셀 3장 (Figma: Mission · Onboarding 1~3 시안).
 * 신규 유저 회원가입 직후 오버레이로 노출. "시작하기"/"건너뛰기" → onDone.
 * 각 장의 히어로는 실제 제품 미니 프리뷰(RoomCard / MissionCard / ProofCard).
 */

const TAUPE = '#d4c5bd';                 // Figma FeaturedCard fill (사진 카드 배경)
const REACT_CORAL = 'rgba(232,81,58,0.4)';

const SLIDES = [
  {
    key: 'room',
    hero: HeroRoomCard,
    title: '친구와 방을 만들어요',
    subtitle: '혼자 또는 친구와 함께\n매일 미션을 인증하는 공간이에요',
  },
  {
    key: 'mission',
    hero: HeroMissionCard,
    title: '매일 하나의 미션',
    subtitle: '방에서 받은 오늘의 미션을\n사진으로 찍어 인증해요',
  },
  {
    key: 'proof',
    hero: HeroProofCard,
    title: '함께라서 더 꾸준히',
    subtitle: '서로 인증해주고 🔥 리액션,\n안 한 친구는 콕 찔러 재촉해요',
  },
];

export default function OnboardingScreen({ onDone }) {
  const C = W;
  const { width } = useWindowDimensions();
  const s = useMemo(() => makeStyles(C), [C]);
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  const goTo = (i) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  };

  const handleNext = () => {
    H.tap();
    if (isLast) onDone?.();
    else goTo(index + 1);
  };

  const onScrollEnd = (e) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  return (
    <View style={s.screen}>
      {/* 건너뛰기 — 마지막 장에서는 숨김 */}
      <View style={s.topBar} pointerEvents="box-none">
        {!isLast ? (
          <TouchableOpacity onPress={() => { H.tap(); onDone?.(); }} hitSlop={12} activeOpacity={0.7}>
            <WarmText v="caption" size={12} color={C.brown}>건너뛰기</WarmText>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide) => {
          const Hero = slide.hero;
          return (
            <View key={slide.key} style={[s.slide, { width }]}>
              <View style={s.heroBox}>
                <Hero C={C} />
              </View>
              <WarmText v="heading" size={26} style={s.title}>{slide.title}</WarmText>
              <WarmText v="section" size={15} color={C.brown} style={s.subtitle}>{slide.subtitle}</WarmText>
            </View>
          );
        })}
      </ScrollView>

      {/* 하단: 도트 + 버튼 */}
      <View style={s.bottom}>
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[s.dot, i === index ? s.dotActive : s.dotIdle]} />
          ))}
        </View>
        <TouchableOpacity activeOpacity={0.85} onPress={handleNext} style={s.cta}>
          <WarmText v="btn">{isLast ? '시작하기' : '다음'}</WarmText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ── 초록 "직접" 배지 (히어로 1·2 공용) ─────────────────── */
function DirectBadge({ C }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 3,
      backgroundColor: C.greenFaint, borderWidth: 1, borderColor: C.green,
      borderRadius: 7, paddingHorizontal: 6, paddingVertical: 2,
    }}>
      <WarmText size={9}>✏️</WarmText>
      <WarmText size={9} color={C.green}>직접</WarmText>
    </View>
  );
}

/* ── 히어로 1: 방 카드 프리뷰 ───────────────────────────── */
function HeroRoomCard({ C }) {
  const avatars = ['🦊', '🐰', '🐻', '🐱'];
  return (
    <View style={[heroStyles.card, { backgroundColor: C.surface, borderColor: C.borderStrong }]}>
      <View style={heroStyles.row}>
        <View style={[heroStyles.fireBox, { backgroundColor: C.neutral, borderColor: C.textSub }]}>
          <WarmText size={14}>🔥</WarmText>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <WarmText v="section" size={13}>우리 동네 갓생러</WarmText>
            <DirectBadge C={C} />
          </View>
          <WarmText v="caption" size={10}>멤버 4명</WarmText>
        </View>
        <View style={{ flexDirection: 'row' }}>
          {avatars.map((e, i) => (
            <View key={i} style={[heroStyles.emojiAv, { backgroundColor: C.surface2, borderColor: C.bg, marginLeft: i === 0 ? 0 : -8 }]}>
              <WarmText size={11}>{e}</WarmText>
            </View>
          ))}
        </View>
      </View>
      <View style={[heroStyles.divider, { backgroundColor: C.border }]} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <WarmText size={15}>🚶</WarmText>
        <WarmText v="body" size={12} style={{ flex: 1 }} numberOfLines={1}>동네 한 바퀴 산책하기</WarmText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={[heroStyles.track, { backgroundColor: C.greenSoft }]}>
          <View style={{ height: '100%', width: '50%', borderRadius: 3, backgroundColor: C.green }} />
        </View>
        <WarmText v="caption" size={10} color={C.brown}>2/4 인증</WarmText>
      </View>
    </View>
  );
}

/* ── 히어로 2: 오늘의 미션 카드 프리뷰 ──────────────────── */
function HeroMissionCard({ C }) {
  return (
    <View style={[heroStyles.card, { backgroundColor: TAUPE, borderColor: C.textSub, gap: 12 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <WarmText v="body" size={12}>오늘의 미션</WarmText>
        <DirectBadge C={C} />
      </View>
      <View style={[heroStyles.innerCard, { backgroundColor: C.bg }]}>
        <View style={[heroStyles.missionIcon, { backgroundColor: C.greenFaint, borderColor: C.greenBorder }]}>
          <WarmText size={28}>🚶</WarmText>
        </View>
        <WarmText size={20} style={{ marginTop: 14, textAlign: 'center' }}>동네 한 바퀴 산책하기</WarmText>
        <View style={[heroStyles.verifyBtn, { backgroundColor: C.green }]}>
          <Ionicons name="camera-outline" size={16} color="#fff" />
          <WarmText size={13} color={C.white}>인증하기</WarmText>
        </View>
      </View>
    </View>
  );
}

/* ── 히어로 3: 인증 카드(사진) 프리뷰 ──────────────────── */
function HeroProofCard({ C }) {
  const reactions = [
    { emoji: '🔥', count: 3, active: true },
    { emoji: '👍', count: 1, active: false },
    { emoji: '🤍', count: 0, active: false },
  ];
  return (
    <View style={[heroStyles.proofCard, { backgroundColor: TAUPE, borderColor: C.textSub }]}>
      <View style={heroStyles.photo}>
        <Image source={require('../assets/onboarding/proof_sample.jpg')} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={heroStyles.userRow}>
          <MemberAvatar avatarId="03" size={27} />
          <View style={{ flex: 1, gap: 2 }}>
            <WarmText size={11} color={C.white}>오프모더</WarmText>
            <WarmText size={10} color="rgba(255,255,255,0.6)">🕐 19:02 미션 완료</WarmText>
          </View>
          <View style={[heroStyles.statusBadge, { backgroundColor: C.textSub, borderColor: C.brown }]}>
            <WarmText size={9} color={C.text}>✓ 인증완료</WarmText>
          </View>
        </View>
      </View>
      <View style={heroStyles.footer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          {reactions.map((r) => (
            <View
              key={r.emoji}
              style={[heroStyles.reactChip, {
                backgroundColor: r.active ? REACT_CORAL : C.textSub,
                borderColor: r.active ? C.coral : C.brown,
              }]}
            >
              <WarmText size={12} color={C.white}>{r.emoji}</WarmText>
              <WarmText size={10} color={C.text}>{r.count}</WarmText>
            </View>
          ))}
          <View style={[heroStyles.addReact, { backgroundColor: C.borderStrong, borderColor: C.brown }]}>
            <WarmText size={10} color={C.text}>+</WarmText>
          </View>
        </View>
        <View style={[heroStyles.verifyChip, { backgroundColor: C.textSub, borderColor: C.brown }]}>
          <WarmText size={9} color={C.text}>인증해주기 2</WarmText>
        </View>
      </View>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  card: {
    width: 300, borderWidth: 1, borderRadius: 16, padding: 14, gap: 10,
    shadowColor: '#2b211a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 28, elevation: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  fireBox: { width: 26, height: 26, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emojiAv: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, width: '100%' },
  track: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },

  innerCard: { borderRadius: 13, padding: 16, alignItems: 'center' },
  missionIcon: { width: 66, height: 66, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  verifyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, alignSelf: 'stretch', marginTop: 16, paddingVertical: 12, borderRadius: 12 },

  proofCard: { width: 300, borderWidth: 1, borderRadius: 15, overflow: 'hidden',
    shadowColor: '#2b211a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 28, elevation: 4 },
  photo: { height: 182, width: '100%' },
  userRow: {
    position: 'absolute', top: 10, left: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6,
  },
  statusBadge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 3 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 11, paddingVertical: 8 },
  reactChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 16, paddingHorizontal: 8, paddingVertical: 4 },
  addReact: { width: 24, height: 20, borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  verifyChip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 9, paddingVertical: 4 },
});

function makeStyles(C) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.bg },
    topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 24, paddingTop: 20, minHeight: 32 },
    slide: { paddingHorizontal: 24, paddingTop: 44, alignItems: 'center' },
    // 3장 모두 타이틀이 같은 y(피그마 388)에 오도록 히어로를 고정 높이로 감싼다
    heroBox: { height: 260, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
    title: { marginTop: 32, textAlign: 'center' },
    subtitle: { marginTop: 14, textAlign: 'center', lineHeight: 23 },
    bottom: { paddingHorizontal: 24, paddingBottom: 32 },
    dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 44 },
    dot: { height: 8, borderRadius: 4 },
    dotActive: { width: 20, backgroundColor: C.green },
    dotIdle: { width: 8, backgroundColor: C.border },
    cta: { backgroundColor: C.green, borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  });
}
