import React, { useState, useMemo } from 'react';
import {
  View, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { W } from '../constants/warm';
import WarmText from '../components/WarmText';
import { GreenButton } from '../components/RoomBits';
import WheelPicker from '../components/WheelPicker';
import * as H from '../utils/haptics';
import { pad } from '../utils/date';

const GL = 'GmarketSansLight';
const { width } = Dimensions.get('window');

const HOURS   = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 5분 단위

const PRESETS = [
  { label: '이른 아침', time: { h: 6,  m: 0 } },
  { label: '아침',     time: { h: 8,  m: 0 } },
  { label: '점심',     time: { h: 12, m: 0 } },
  { label: '저녁',     time: { h: 18, m: 0 } },
  { label: '밤',       time: { h: 21, m: 0 } },
  { label: '자정 전',  time: { h: 23, m: 0 } },
];

function ampmLabel(h) {
  if (h < 6)  return '새벽';
  if (h < 12) return '오전';
  if (h < 18) return '오후';
  return '밤';
}

// 웜 톤 휠 항목 (SignupScreen step2와 동일 규격)
function renderWheelLabel(val, selected) {
  return (
    <WarmText
      size={selected ? 30 : 24}
      color={selected ? W.text : W.green}
      style={{ opacity: selected ? 1 : 0.4 }}
    >
      {pad(val)}
    </WarmText>
  );
}

export default function MissionTimeScreen({ onBack, onSave, initialTime = { hour: 8, minute: 0 } }) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);

  const [hourIdx,   setHourIdx]   = useState(initialTime.hour);
  const [minuteIdx, setMinuteIdx] = useState(Math.round(initialTime.minute / 5));
  const h = HOURS[hourIdx];
  const m = MINUTES[minuteIdx];

  const handleSave = () => {
    H.success();
    onSave && onSave({ hour: h, minute: m });
    onBack && onBack();
  };

  return (
    <View style={s.screen}>
      {/* 헤더 — SettingsScreen과 동일 규격 */}
      <View style={s.header}>
        <TouchableOpacity style={s.side} onPress={() => { H.tap(); onBack && onBack(); }} hitSlop={12} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={C.text} />
        </TouchableOpacity>
        <WarmText v="body" size={20}>미션 수신 시간</WarmText>
        <View style={s.side} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <WarmText v="sub" style={{ textAlign: 'center', marginBottom: 24 }}>
          매일 이 시간에 오늘의 미션 알림을 받아요.{'\n'}스스로 지킬 수 있는 시간으로 정해보세요.
        </WarmText>

        {/* 시간 미리보기 */}
        <View style={s.previewWrap}>
          <WarmText v="body" color={C.green} style={{ opacity: 0.8, marginBottom: 4, letterSpacing: 1 }}>{ampmLabel(h)}</WarmText>
          <WarmText color={C.text} size={52} style={{ letterSpacing: 2, lineHeight: 62, fontFamily: GL }}>{pad(h)} : {pad(m)}</WarmText>
          <WarmText v="label" color={C.textSub} style={{ marginTop: 6 }}>매일 이 시간에 미션 도착</WarmText>
        </View>

        {/* 휠 피커 */}
        <View style={s.pickerRow}>
          <View style={s.pickerBlock}>
            <WarmText v="sub" style={{ marginBottom: 8, textAlign: 'center' }}>시</WarmText>
            <WheelPicker items={HOURS}   selectedIndex={hourIdx}   onChange={setHourIdx}   colors={C} renderLabel={renderWheelLabel} />
          </View>
          <WarmText size={32} color={C.textSub} style={{ marginTop: 12, paddingHorizontal: 8, opacity: 0.5 }}>:</WarmText>
          <View style={s.pickerBlock}>
            <WarmText v="sub" style={{ marginBottom: 8, textAlign: 'center' }}>분</WarmText>
            <WheelPicker items={MINUTES} selectedIndex={minuteIdx} onChange={setMinuteIdx} colors={C} renderLabel={renderWheelLabel} />
          </View>
        </View>

        {/* 빠른 선택 */}
        <WarmText v="body" color={C.textSub} style={{ marginBottom: 12 }}>빠른 선택</WarmText>
        <View style={s.presetGrid}>
          {PRESETS.map((p) => {
            const active = p.time.h === h && p.time.m === m;
            return (
              <TouchableOpacity
                key={p.label}
                style={[s.presetChip, active && s.presetChipActive]}
                onPress={() => { H.tap(); setHourIdx(p.time.h); setMinuteIdx(p.time.m / 5); }}
                activeOpacity={0.7}
              >
                <WarmText v="body" size={15} color={active ? C.green : C.textSub} style={{ marginBottom: 2 }}>
                  {pad(p.time.h)}:{pad(p.time.m)}
                </WarmText>
                <WarmText v="caption" color={active ? C.green : C.textSub} style={{ opacity: active ? 1 : 0.7 }}>
                  {p.label}
                </WarmText>
              </TouchableOpacity>
            );
          })}
        </View>

        <GreenButton label={`${pad(h)}:${pad(m)}으로 설정하기`} onPress={handleSave} />
      </ScrollView>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: C.bg },
    header:  {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 12, paddingTop: 16, paddingBottom: 12,
    },
    side:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
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
    pickerBlock: { flex: 1, alignItems: 'stretch' },
    presetGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
    presetChip: {
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
      alignItems: 'center', minWidth: (width - 40 - 16) / 3,
    },
    presetChipActive: { backgroundColor: C.greenFaint, borderColor: C.greenBorder },
  });
}
