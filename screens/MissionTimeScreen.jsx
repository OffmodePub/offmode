import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../utils/useColors';
import T from '../components/ThemedText';

const F = 'Kkukkukk';
const { width } = Dimensions.get('window');

const ITEM_H  = 60;
const VISIBLE = 3;
const PICKER_H = ITEM_H * VISIBLE;

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

function pad(n) { return String(n).padStart(2, '0'); }
function ampmLabel(h) {
  if (h < 6)  return '새벽';
  if (h < 12) return '오전';
  if (h < 18) return '오후';
  return '밤';
}

function WheelPicker({ items, selectedIndex, onChange }) {
  const C = useColors();
  const wheel = useMemo(() => makeWheelStyles(C), [C]);
  const scrollRef           = useRef(null);
  const isProgrammatic      = useRef(false);
  const selectedIndexRef    = useRef(selectedIndex);
  selectedIndexRef.current  = selectedIndex; // 매 렌더마다 최신값 유지

  // selectedIndex 변경 시 스크롤 위치 동기화
  useEffect(() => {
    isProgrammatic.current = true;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: false });
      requestAnimationFrame(() => { isProgrammatic.current = false; });
    });
  }, [selectedIndex]);

  // 초기 레이아웃 완료 후 위치 설정 (ref로 최신값 참조 → stale closure 방지)
  const onLayout = useCallback(() => {
    isProgrammatic.current = true;
    scrollRef.current?.scrollTo({ y: selectedIndexRef.current * ITEM_H, animated: false });
    requestAnimationFrame(() => { isProgrammatic.current = false; });
  }, []);

  // 사용자가 직접 스크롤했을 때만 onChange 호출
  const handleMomentumEnd = useCallback((e) => {
    if (isProgrammatic.current) return;
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    if (clamped !== selectedIndex) onChange(clamped);
  }, [items.length, selectedIndex, onChange]);

  return (
    <View style={wheel.wrap}>
      <View style={wheel.highlight} pointerEvents="none" />
      <LinearGradient colors={[C.surface, 'transparent']} style={[wheel.fade, { top: 0 }]}    pointerEvents="none" />
      <LinearGradient colors={['transparent', C.surface]} style={[wheel.fade, { bottom: 0 }]} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        style={{ height: PICKER_H, width: '100%' }}
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
            style={wheel.item}
            activeOpacity={0.6}
            onPress={() => onChange(i)}
          >
            <T
              v="sub"
              size={i === selectedIndex ? 34 : 28}
              color={i === selectedIndex ? C.text : C.textSub}
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

function makeWheelStyles(C) {
  return StyleSheet.create({
    wrap: { flex: 1, position: 'relative', overflow: 'hidden', height: PICKER_H },
    highlight: {
      position: 'absolute', top: ITEM_H * 1, left: 0, right: 0, height: ITEM_H,
      borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.greenBorder,
      backgroundColor: C.greenFaint, zIndex: 1, borderRadius: 8,
    },
    fade: { position: 'absolute', left: 0, right: 0, height: ITEM_H * 1.0, zIndex: 2 },
    item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
    itemTextSelected: { color: C.text, opacity: 1, fontSize: 34 },
  });
}

export default function MissionTimeScreen({ onBack, onSave, initialTime = { hour: 8, minute: 0 } }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [hourIdx,   setHourIdx]   = useState(initialTime.hour);
  const [minuteIdx, setMinuteIdx] = useState(Math.round(initialTime.minute / 5));
  const h = HOURS[hourIdx];
  const m = MINUTES[minuteIdx];
  
  const handleSave = () => {
    onSave && onSave({ hour: h, minute: m });
    onBack && onBack();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <T v="section" size={17}>미션 수신 시간</T>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <T v="sub" style={{ lineHeight: 20, textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
          매일 이 시간에 오늘의 미션 알림을 받아요.{'\n'}스스로 지킬 수 있는 시간으로 설정하세요.
        </T>

        <View style={styles.previewWrap}>
          <T v="green" style={{ opacity: 0.8, marginBottom: 4, letterSpacing: 1 }}>{ampmLabel(h)}</T>
          <T v="stat" size={56} style={{ letterSpacing: 2, lineHeight: 66 }}>{pad(h)} : {pad(m)}</T>
          <T v="label" style={{ marginTop: 6 }}>매일 이 시간에 미션 도착</T>
        </View>

        <View style={styles.pickerRow}>
          <View style={styles.pickerBlock}>
            <T v="sub" style={{ marginBottom: 8, textAlign: 'center' }}>시</T>
            <WheelPicker items={HOURS}   selectedIndex={hourIdx}   onChange={setHourIdx} />
          </View>
          <T v="sub" size={36} style={{ marginTop: 16, paddingHorizontal: 8, opacity: 0.5 }}>:</T>
          <View style={styles.pickerBlock}>
            <T v="sub" style={{ marginBottom: 8, textAlign: 'center' }}>분</T>
            <WheelPicker items={MINUTES} selectedIndex={minuteIdx} onChange={setMinuteIdx} />
          </View>
        </View>

        <T v="body" color={C.textSub} style={{ marginBottom: 12 }}>빠른 선택</T>
        <View style={styles.presetGrid}>
          {PRESETS.map((p) => {
            const active = p.time.h === h && p.time.m === m;
            return (
              <TouchableOpacity
                key={p.label}
                style={[styles.presetChip, active && styles.presetChipActive]}
                onPress={() => { setHourIdx(p.time.h); setMinuteIdx(p.time.m / 5); }}
                activeOpacity={0.7}
              >
                <T v="body" size={16} color={active ? C.green : C.textSub} style={{ marginBottom: 2 }}>
                  {pad(p.time.h)}:{pad(p.time.m)}
                </T>
                <T v="caption" color={active ? C.green : C.textSub} style={{ opacity: active ? 1 : 0.7 }}>
                  {p.label}
                </T>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity onPress={handleSave} activeOpacity={0.85} style={{ marginTop: 8 }}>
          <LinearGradient colors={['#26d67a', '#1ab065']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtn}>
            <T v="btn">{pad(h)}:{pad(m)} 으로 설정하기</T>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
      alignItems: 'center', justifyContent: 'center',
    },
    backIcon:    { fontSize: 20, color: C.text },
    content:     { paddingHorizontal: 20, paddingBottom: 40 },
    previewWrap: {
      alignItems: 'center', backgroundColor: C.surface,
      borderRadius: 20, borderWidth: 1, borderColor: C.greenBorder,
      paddingVertical: 24, marginBottom: 28,
    },
    pickerRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border,
      paddingHorizontal: 8, paddingVertical: 12, marginBottom: 28,
    },
    pickerBlock: { flex: 1, alignItems: 'stretch' },
    presetGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
    presetChip: {
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
      alignItems: 'center', minWidth: (width - 40 - 16) / 3,
    },
    presetChipActive:  { backgroundColor: C.greenFaint, borderColor: C.greenBorder },
    presetTimeActive:  { color: C.green },
    presetLabelActive: { color: C.green, opacity: 1 },
    saveBtn:     { borderRadius: 16, paddingVertical: 17, alignItems: 'center' },
  });
}
