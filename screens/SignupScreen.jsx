import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Keyboard, ScrollView, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../utils/useColors';
import T from '../components/ThemedText';
import * as H from '../utils/haptics';
import { AVATAR_IDS, getAvatarDefaultSource } from '../utils/avatars';

const F = 'Kkukkukk';
const { width } = Dimensions.get('window');

// ── 아바타 SVG 렌더러 ──────────────────────────────────────
function AvatarSvg({ source: SvgComponent, width = 80, height = 80 }) {
  if (!SvgComponent) return <View style={{ width, height }} />;
  return <SvgComponent width={width} height={height} />;
}

// ── 시간 휠 피커 ──────────────────────────────────────────
const ITEM_H  = 60;
const VISIBLE = 3;
const PICKER_H = ITEM_H * VISIBLE;
const HOURS   = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 5분 단위
const PRESETS = [
  { label: '이른 아침', h: 6,  m: 0 },
  { label: '아침',     h: 8,  m: 0 },
  { label: '점심',     h: 12, m: 0 },
  { label: '저녁',     h: 18, m: 0 },
  { label: '밤',       h: 21, m: 0 },
];

function pad(n) { return String(n).padStart(2, '0'); }
function ampmLabel(h) {
  if (h < 6)  return '새벽';
  if (h < 12) return '오전';
  if (h < 18) return '오후';
  return '밤';
}

function WheelPicker({ items, selectedIndex, onChange }) {
  const C = useColors();
  const scrollRef          = useRef(null);
  const isProgrammatic     = useRef(false);
  const selectedIndexRef   = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;

  useEffect(() => {
    isProgrammatic.current = true;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: false });
      requestAnimationFrame(() => { isProgrammatic.current = false; });
    });
  }, [selectedIndex]);

  const onLayout = useCallback(() => {
    isProgrammatic.current = true;
    scrollRef.current?.scrollTo({ y: selectedIndexRef.current * ITEM_H, animated: false });
    requestAnimationFrame(() => { isProgrammatic.current = false; });
  }, []);

  const handleMomentumEnd = useCallback((e) => {
    if (isProgrammatic.current) return;
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    if (clamped !== selectedIndex) onChange(clamped);
  }, [items.length, selectedIndex, onChange]);

  return (
    <View style={{ flex: 1, position: 'relative', overflow: 'hidden', height: PICKER_H }}>
      {/* 선택 하이라이트 */}
      <View style={{
        position: 'absolute', top: ITEM_H * 1, left: 0, right: 0, height: ITEM_H,
        borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.greenBorder,
        backgroundColor: C.greenFaint, zIndex: 1, borderRadius: 8,
      }} pointerEvents="none" />
      <LinearGradient colors={[C.surface, C.surface + '00']} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: ITEM_H * 1.0, zIndex: 2 }} pointerEvents="none" />
      <LinearGradient colors={[C.surface + '00', C.surface]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: ITEM_H * 1.0, zIndex: 2 }} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        style={{ height: PICKER_H }}
        contentContainerStyle={{ paddingVertical: ITEM_H * 1 }}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumEnd}
        onLayout={onLayout}
        scrollEventThrottle={16}
      >
        {items.map((val, i) => (
          <TouchableOpacity
            key={i}
            style={{ height: ITEM_H, alignItems: 'center', justifyContent: 'center' }}
            activeOpacity={0.6}
            onPress={() => onChange(i)}
          >
            <T
              v="sub"
              size={i === selectedIndex ? 30 : 24}
              color={i === selectedIndex ? C.text : (C.isDark ? C.textSub : C.green)}
              style={{ opacity: i === selectedIndex ? 1 : 0.4 }}
            >
              {pad(val)}
            </T>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────
export default function SignupScreen({ defaultName = '', onComplete }) {
  const C = useColors();
  const s = useMemo(() => makeStyles(C), [C]);

  const [step,           setStep]           = useState(1); // 1: 프로필, 2: 미션 시간
  const [name,           setName]           = useState(defaultName);
  const [avatarId,       setAvatarId]       = useState('01');
  const [hourIdx,        setHourIdx]        = useState(8);
  const [minuteIdx,      setMinuteIdx]      = useState(0);
  const [outerScrollEnabled, setOuterScrollEnabled] = useState(true);

  const h = HOURS[hourIdx];
  const m = MINUTES[minuteIdx];

  const canNext = name.trim().length > 0;

  const handleNext = () => {
    if (!canNext) return;
    Keyboard.dismiss();
    H.tap();
    setStep(2);
  };

  const handleDone = () => {
    H.success();
    onComplete({
      name: name.trim(),
      avatar: avatarId,
      missionTime: { hour: h, minute: m },
    });
  };

  // ── Step 1: 아바타 + 닉네임 ──────────────────────────────
  if (step === 1) {
    return (
      <KeyboardAvoidingView
        style={s.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.stepIndicator}>
            <View style={[s.dot, s.dotActive]} />
            <View style={s.dot} />
          </View>

          <View style={s.header}>
            <T v="logo" size={20} style={{ letterSpacing: 4, marginBottom: 8 }}>OFFMODE</T>
            <T v="title" size={22}>프로필을 설정해요</T>
            <T v="sub" style={{ marginTop: 8, textAlign: 'center' }}>나중에 설정에서 변경할 수 있어요</T>
          </View>

          {/* 선택된 아바타 미리보기 */}
          <View style={s.previewRow}>
            <View style={s.previewRing}>
              <AvatarSvg source={getAvatarDefaultSource(avatarId)} width={150} height={150} />
            </View>
          </View>

          {/* 아바타 선택 */}
          <T v="label" style={s.sectionLabel}>아바타 선택</T>
          <View style={s.avatarGrid}>
            {AVATAR_IDS.map((id) => (
              <TouchableOpacity
                key={id}
                style={[s.avatarCell, avatarId === id && s.avatarCellActive]}
                onPress={() => { H.tap(); setAvatarId(id); }}
                activeOpacity={0.7}
              >
                <AvatarSvg source={getAvatarDefaultSource(id)} width={52} height={52} />
                {avatarId === id && (
                  <View style={s.avatarCheck}><T v="green" size={10}>✓</T></View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* 닉네임 */}
          <T v="label" style={s.sectionLabel}>닉네임</T>
          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="닉네임 입력 (최대 12자)"
              placeholderTextColor={C.textSub}
              maxLength={12}
              returnKeyType="next"
              onSubmitEditing={handleNext}
            />
            <T v="caption" style={{ opacity: 0.4 }}>{name.length}/12</T>
          </View>

          <TouchableOpacity onPress={handleNext} activeOpacity={0.85} disabled={!canNext}>
            <LinearGradient
              colors={canNext ? ['#26d67a', '#1ab065'] : [C.surface2, C.surface2]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.btn}
            >
              <T v="btn" style={{ color: canNext ? '#000' : C.textSub }}>다음 →</T>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Step 2: 미션 시간 ─────────────────────────────────────
  return (
    <View style={s.screen}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={outerScrollEnabled}
      >
        <View style={s.stepIndicator}>
          <View style={s.dot} />
          <View style={[s.dot, s.dotActive]} />
        </View>

        <View style={s.header}>
          <T v="logo" size={20} style={{ letterSpacing: 4, marginBottom: 8 }}>OFFMODE</T>
          <T v="title" size={22}>미션 시간을 정해요</T>
          <T v="sub" style={{ marginTop: 8, textAlign: 'center' }}>
            매일 이 시간에 오늘의 미션을 받아요.{'\n'}스스로 지킬 수 있는 시간으로 설정하세요.
          </T>
        </View>

        {/* 시간 미리보기 */}
        <View style={s.previewWrap}>
          <T v="green" style={{ opacity: 0.8, marginBottom: 4, letterSpacing: 1 }}>{ampmLabel(h)}</T>
          <T v="stat" size={52} style={{ letterSpacing: 2, lineHeight: 62 }}>{pad(h)} : {pad(m)}</T>
          <T v="label" style={{ marginTop: 6 }}>매일 이 시간에 미션 도착</T>
        </View>

        {/* 휠 피커 */}
        <View
          style={s.pickerRow}
          onTouchStart={() => setOuterScrollEnabled(false)}
          onTouchEnd={() => setOuterScrollEnabled(true)}
          onTouchCancel={() => setOuterScrollEnabled(true)}
        >
          <View style={{ flex: 1, alignItems: 'stretch' }}>
            <T v="sub" style={{ marginBottom: 8, textAlign: 'center' }}>시</T>
            <WheelPicker items={HOURS}   selectedIndex={hourIdx}   onChange={setHourIdx} />
          </View>
          <T v="sub" size={32} style={{ marginTop: 12, paddingHorizontal: 8, opacity: 0.5 }}>:</T>
          <View style={{ flex: 1, alignItems: 'stretch' }}>
            <T v="sub" style={{ marginBottom: 8, textAlign: 'center' }}>분</T>
            <WheelPicker items={MINUTES} selectedIndex={minuteIdx} onChange={setMinuteIdx} />
          </View>
        </View>

        {/* 빠른 선택 */}
        <T v="body" color={C.textSub} style={{ marginBottom: 12 }}>빠른 선택</T>
        <View style={s.presetGrid}>
          {PRESETS.map((p) => {
            const active = p.h === h && p.m === m;
            const mIdx = MINUTES.indexOf(p.m);
            return (
              <TouchableOpacity
                key={p.label}
                style={[s.presetChip, active && s.presetChipActive]}
                onPress={() => { setHourIdx(p.h); setMinuteIdx(mIdx >= 0 ? mIdx : 0); }}
                activeOpacity={0.7}
              >
                <T v="body" size={15} color={active ? C.green : C.textSub} style={{ marginBottom: 2 }}>
                  {pad(p.h)}:{pad(p.m)}
                </T>
                <T v="caption" color={active ? C.green : C.textSub} style={{ opacity: active ? 1 : 0.7 }}>
                  {p.label}
                </T>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={s.bottomRow}>
          <TouchableOpacity onPress={() => { H.tap(); setStep(1); }} style={s.backBtn} activeOpacity={0.7}>
            <T v="body" color={C.textSub}>← 이전</T>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDone} activeOpacity={0.85} style={{ flex: 1 }}>
            <LinearGradient
              colors={['#26d67a', '#1ab065']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.btn}
            >
              <T v="btn" style={{ color: '#000' }}>시작하기 →</T>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: C.bg },
    content: { paddingHorizontal: 28, paddingTop: 48, paddingBottom: 48 },

    stepIndicator: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32 },
    dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },
    dotActive: { backgroundColor: C.green, width: 20 },

    header: { alignItems: 'center', marginBottom: 28 },

    previewRow:  { alignItems: 'center', marginBottom: 24 },
    previewRing: {
      width: 150, height: 150, borderRadius: 50,
      borderWidth: 2, borderColor: C.greenBorder,
      backgroundColor: C.greenFaint,
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    },

    sectionLabel: { marginBottom: 12, opacity: 0.6, letterSpacing: 1 },

    avatarGrid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28,
      justifyContent: 'center',
    },
    avatarCell: {
      width: 64, height: 64, borderRadius: 16,
      backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarCellActive: { borderColor: C.green, backgroundColor: C.greenFaint },
    avatarCheck: {
      position: 'absolute', bottom: 4, right: 4,
      backgroundColor: C.green, borderRadius: 6,
      width: 14, height: 14, alignItems: 'center', justifyContent: 'center',
    },

    inputWrap: {
      backgroundColor: C.surface, borderRadius: 14,
      borderWidth: 1, borderColor: C.border,
      paddingHorizontal: 16, paddingVertical: 14,
      flexDirection: 'row', alignItems: 'center', marginBottom: 28,
    },
    input: { flex: 1, fontFamily: F, fontSize: 16, color: C.text },

    btn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },

    previewWrap: {
      alignItems: 'center', backgroundColor: C.surface,
      borderRadius: 20, borderWidth: 1, borderColor: C.greenBorder,
      paddingVertical: 20, marginBottom: 24,
    },
    pickerRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border,
      paddingHorizontal: 8, paddingVertical: 12, marginBottom: 24,
    },
    presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
    presetChip: {
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
      alignItems: 'center', minWidth: (width - 56 - 16) / 3,
    },
    presetChipActive: { backgroundColor: C.greenFaint, borderColor: C.greenBorder },

    bottomRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    backBtn: {
      paddingHorizontal: 16, paddingVertical: 18,
      backgroundColor: C.surface, borderRadius: 16,
      borderWidth: 1, borderColor: C.border,
    },
  });
}
