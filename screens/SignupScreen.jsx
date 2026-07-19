import React, { useState, useMemo } from 'react';
import {
  View, StyleSheet, TouchableOpacity,
  TextInput, Keyboard, ScrollView, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import T from '../components/WarmText';
import { W } from '../constants/warm';
import PageIndicator from '../components/PageIndicator';
import { GreenButton } from '../components/RoomBits';
import * as H from '../utils/haptics';
import { AVATAR_IDS, getAvatarDefaultSource } from '../utils/avatars';
import AvatarImage from '../components/AvatarImage';
import WheelPicker from '../components/WheelPicker';
import { pad } from '../utils/date';

const GL = 'GmarketSansLight';
const { width } = Dimensions.get('window');

// Figma(59:27) 프로필 설정 화면 — 아바타 얼굴 5종
const PICKER_IDS = AVATAR_IDS;

// ── 시간 휠 피커 데이터 ───────────────────────────────────
const HOURS   = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 5분 단위
const PRESETS = [
  { label: '이른 아침', h: 6,  m: 0 },
  { label: '아침',     h: 8,  m: 0 },
  { label: '점심',     h: 12, m: 0 },
  { label: '저녁',     h: 18, m: 0 },
  { label: '밤',       h: 21, m: 0 },
];

function ampmLabel(h) {
  if (h < 6)  return '새벽';
  if (h < 12) return '오전';
  if (h < 18) return '오후';
  return '밤';
}

// 공용 WheelPicker 항목 텍스트 (기존 이 화면 전용 렌더링 그대로)
function renderWheelLabel(val, selected) {
  return (
    <T
      size={selected ? 30 : 24}
      color={selected ? W.text : W.green}
      style={{ opacity: selected ? 1 : 0.4 }}
    >
      {pad(val)}
    </T>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────
export default function SignupScreen({ defaultName = '', onComplete }) {
  const s = useMemo(() => makeStyles(), []);

  const [step,           setStep]           = useState(1); // 1: 프로필, 2: 미션 시간
  const [name,           setName]           = useState(defaultName);
  const [avatarId,       setAvatarId]       = useState(PICKER_IDS[0]);
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
          <PageIndicator count={2} active={0} />

          <View style={{ height: 72 }} />

          <View style={s.header}>
            <T v="logo" size={20} style={{ letterSpacing: 4, marginBottom: 10, fontFamily: GL }}>OFFMODE</T>
            <T v="title" size={22} color={W.green} style={{ marginBottom: 10 }}>프로필을 설정해요</T>
            <T v="sub" style={{ textAlign: 'center' }}>나중에 설정에서 변경할 수 있어요</T>
          </View>

          <View style={{ height: 73 }} />

          {/* 선택된 아바타 미리보기 */}
          <View style={s.previewRing}>
            <View style={s.previewInner}>
              <AvatarImage source={getAvatarDefaultSource(avatarId)} width={140} height={140} />
            </View>
          </View>

          <View style={{ height: 24 }} />

          {/* 아바타 선택 */}
          <View style={s.avatarRow}>
            {PICKER_IDS.map((id) => {
              const active = avatarId === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[s.slot, active && s.slotActive]}
                  onPress={() => { H.tap(); setAvatarId(id); }}
                  activeOpacity={0.7}
                >
                  <View style={[s.avatarInner, !active && s.avatarInnerBorder]}>
                    <AvatarImage source={getAvatarDefaultSource(id)} width={44} height={44} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 40 }} />

          {/* 닉네임 */}
          <T v="label" color={W.green} style={s.nickLabel}>닉네임</T>
          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="닉네임 입력 (최대 12자)"
              placeholderTextColor="rgba(46,125,82,0.5)"
              maxLength={12}
              returnKeyType="next"
              onSubmitEditing={handleNext}
            />
            <T v="caption" color={W.green} style={{ opacity: 0.4 }}>{name.length}/12</T>
          </View>

          <View style={{ height: 100 }} />

          {/* Figma py 18 — GreenButton은 내부 패딩 오버라이드가 안 돼 동일 규격 로컬 버튼 사용 */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleNext}
            disabled={!canNext}
            style={{ width: '100%' }}
          >
            <View style={[s.nextBtn, !canNext && s.nextBtnDisabled]}>
              <T v="btn" style={!canNext ? { color: W.text } : undefined}>다음 →</T>
            </View>
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
        <PageIndicator count={2} active={1} />

        <View style={{ height: 40 }} />

        <View style={s.header}>
          <T v="logo" size={20} style={{ letterSpacing: 4, marginBottom: 10, fontFamily: GL }}>OFFMODE</T>
          <T v="title" size={22} color={W.green} style={{ marginBottom: 10 }}>미션 시간을 정해요</T>
          <T v="sub" style={{ textAlign: 'center' }}>
            매일 이 시간에 오늘의 미션을 받아요.{'\n'}스스로 지킬 수 있는 시간으로 정해보세요.
          </T>
        </View>

        <View style={{ height: 28 }} />

        {/* 시간 미리보기 */}
        <View style={s.previewWrap}>
          <T v="body" color={W.green} style={{ opacity: 0.8, marginBottom: 4, letterSpacing: 1 }}>{ampmLabel(h)}</T>
          <T color={W.text} size={52} style={{ letterSpacing: 2, lineHeight: 62, fontFamily: GL }}>{pad(h)} : {pad(m)}</T>
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
            <WheelPicker items={HOURS}   selectedIndex={hourIdx}   onChange={setHourIdx}   colors={W} renderLabel={renderWheelLabel} />
          </View>
          <T size={32} color={W.textSub} style={{ marginTop: 12, paddingHorizontal: 8, opacity: 0.5 }}>:</T>
          <View style={{ flex: 1, alignItems: 'stretch' }}>
            <T v="sub" style={{ marginBottom: 8, textAlign: 'center' }}>분</T>
            <WheelPicker items={MINUTES} selectedIndex={minuteIdx} onChange={setMinuteIdx} colors={W} renderLabel={renderWheelLabel} />
          </View>
        </View>

        {/* 빠른 선택 */}
        <T v="body" color={W.textSub} style={{ marginBottom: 12 }}>빠른 선택</T>
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
                <T v="body" size={15} color={active ? W.green : W.textSub} style={{ marginBottom: 2 }}>
                  {pad(p.h)}:{pad(p.m)}
                </T>
                <T v="caption" color={active ? W.green : W.textSub} style={{ opacity: active ? 1 : 0.7 }}>
                  {p.label}
                </T>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={s.bottomRow}>
          <TouchableOpacity onPress={() => { H.tap(); setStep(1); }} style={s.backBtn} activeOpacity={0.7}>
            <T v="body" color={W.textSub}>← 이전</T>
          </TouchableOpacity>
          <GreenButton label="시작하기 →" onPress={handleDone} style={{ flex: 1 }} />
        </View>

      </ScrollView>
    </View>
  );
}

function makeStyles() {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: W.bg },
    content: { paddingHorizontal: 28, paddingTop: 48, paddingBottom: 48 },

    header: { alignItems: 'center' },

    // 미리보기 링 — Figma: 흰 원(150) + 다크 아웃라인 1px, 내부 크림 원(140)
    previewRing: {
      width: 150, height: 150, borderRadius: 75,
      borderWidth: 1, borderColor: W.text,
      backgroundColor: W.white,
      alignItems: 'center', justifyContent: 'center',
      alignSelf: 'center', overflow: 'hidden',
    },
    previewInner: {
      width: 140, height: 140, borderRadius: 70,
      backgroundColor: W.surface2,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },

    // 아바타 선택 — Figma: 원형 5종, 선택 시 그린 링
    avatarRow: {
      flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center',
    },
    slot: {
      width: 52, height: 52, borderRadius: 26,
      borderWidth: 2, borderColor: 'transparent',
      alignItems: 'center', justifyContent: 'center',
    },
    slotActive: { borderColor: W.greenBorder },
    avatarInner: {
      width: 44, height: 44, borderRadius: 22, overflow: 'hidden',
      backgroundColor: W.surface2,
      borderWidth: 1, borderColor: 'transparent',
      alignItems: 'center', justifyContent: 'center',
    },
    avatarInnerBorder: { borderColor: W.borderStrong },

    // 닉네임 — Figma: 그린 라벨 + 그린 틴트 입력창
    nickLabel: { alignSelf: 'stretch', opacity: 0.6 },
    inputWrap: {
      backgroundColor: W.greenFaint, borderRadius: 14,
      borderWidth: 1, borderColor: W.green,
      paddingHorizontal: 16, paddingVertical: 14,
      flexDirection: 'row', alignItems: 'center', marginTop: 12,
    },
    input: { flex: 1, fontFamily: GL, fontSize: 16, color: W.green },

    // "다음" 버튼 — GreenButton 규격 + Figma py 18
    nextBtn: {
      alignItems: 'center', justifyContent: 'center',
      borderRadius: 16, paddingVertical: 18,
      backgroundColor: W.green,
    },
    nextBtnDisabled: {
      backgroundColor: W.neutralStrong,
      borderWidth: 1, borderColor: W.text,
    },

    // Step 2
    previewWrap: {
      alignItems: 'center', backgroundColor: W.surface,
      borderRadius: 20, borderWidth: 1, borderColor: W.greenBorder,
      paddingVertical: 20, marginBottom: 24,
    },
    pickerRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: W.surface, borderRadius: 20, borderWidth: 1, borderColor: W.border,
      paddingHorizontal: 8, paddingVertical: 12, marginBottom: 24,
    },
    presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
    presetChip: {
      backgroundColor: W.surface, borderWidth: 1, borderColor: W.border,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
      alignItems: 'center', minWidth: (width - 56 - 16) / 3,
    },
    presetChipActive: { backgroundColor: W.greenFaint, borderColor: W.greenBorder },

    bottomRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    backBtn: {
      paddingHorizontal: 16, paddingVertical: 16,
      backgroundColor: W.surface, borderRadius: 16,
      borderWidth: 1, borderColor: W.border,
      alignItems: 'center', justifyContent: 'center',
    },
  });
}
