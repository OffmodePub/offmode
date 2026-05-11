import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Easing, Dimensions, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../utils/useColors';
import { api } from '../utils/api';
import T from '../components/ThemedText';

const F = 'Kkukkukk';
const { width } = Dimensions.get('window');

const ITEM_H  = 80;
const VISIBLE = 3;
const REPEATS = 6;
const SLOT_H  = ITEM_H * VISIBLE;

function getCategoryColor(cat, C) {
  if (cat === 'Energy')    return C.blue;
  if (cat === 'Intellect') return C.purple;
  return C.green;
}

function SlotMachine({ onDone, autoSpin = true, missions }) {
  const C = useColors();
  const slot = useMemo(() => makeSlotStyles(C), [C]);
  const translateY = useRef(new Animated.Value(0)).current;
  const [spinning,  setSpinning]  = useState(false);
  const [landed,    setLanded]    = useState(false);
  const [finalIdx,  setFinalIdx]  = useState(null);
  const [started,   setStarted]   = useState(autoSpin);

  const ITEMS = useMemo(
    () => Array.from({ length: REPEATS }, () => missions).flat(),
    [missions]
  );

  const spin = () => {
    if (spinning || missions.length === 0) return;
    setStarted(true);
    setSpinning(true);
    setLanded(false);
    // 가중치 기반 랜덤 선택: weight가 낮은 미션은 뽑힐 확률이 낮음
    const totalWeight = missions.reduce((sum, m) => sum + (m.weight ?? 1), 0);
    let r = Math.random() * totalWeight;
    let targetMissionIdx = missions.length - 1;
    for (let i = 0; i < missions.length; i++) {
      r -= (missions[i].weight ?? 1);
      if (r <= 0) { targetMissionIdx = i; break; }
    }
    const targetBlockStart = (REPEATS - 2) * missions.length;
    const targetItemIdx    = targetBlockStart + targetMissionIdx;
    const targetY          = -(targetItemIdx * ITEM_H) + ITEM_H;
    translateY.setValue(0);
    Animated.timing(translateY, {
      toValue: targetY, duration: 3200,
      easing: Easing.out(Easing.exp), useNativeDriver: true,
    }).start(() => {
      setSpinning(false);
      setLanded(true);
      setFinalIdx(targetMissionIdx);
      onDone && onDone(missions[targetMissionIdx]);
    });
  };

  useEffect(() => {
    if (autoSpin) {
      const t = setTimeout(spin, 400);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <View style={slot.root}>
      <LinearGradient colors={[C.bg, 'transparent']} style={[slot.fade, { top: 0 }]}    pointerEvents="none" />
      <LinearGradient colors={['transparent', C.bg]} style={[slot.fade, { bottom: 0 }]} pointerEvents="none" />
      <View style={slot.highlight} pointerEvents="none" />
      <View style={slot.window}>
        <Animated.View style={{ transform: [{ translateY }] }}>
          {ITEMS.map((m, i) => {
            const isSelected = landed && i === ((REPEATS - 2) * missions.length + (finalIdx ?? 0));
            return (
              <View key={i} style={slot.item}>
                <Text style={slot.itemIcon}>{m.icon}</Text>
                <T v="sub" size={15} style={[{ flex: 1, lineHeight: 22 }, isSelected && { color: getCategoryColor(m.category, C) }]} numberOfLines={2}>
                  {m.text}
                </T>
              </View>
            );
          })}
        </Animated.View>
      </View>

      {/* 수동 모드: 아직 돌리기 전 버튼 */}
      {!autoSpin && !started && (
        <TouchableOpacity onPress={spin} style={slot.manualBtn} activeOpacity={0.8}>
          <LinearGradient colors={['#26d67a', '#1ab065']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={slot.manualBtnInner}>
            <T v="btn" size={16}>🎰  돌리기</T>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

function makeSlotStyles(C) {
  return StyleSheet.create({
    root: {
      height: SLOT_H, position: 'relative', overflow: 'hidden',
      borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface,
    },
    window:    { height: SLOT_H, overflow: 'hidden' },
    highlight: {
      position: 'absolute', top: ITEM_H, left: 0, right: 0, height: ITEM_H,
      borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.greenBorder,
      backgroundColor: C.greenFaint, zIndex: 1,
    },
    fade: { position: 'absolute', left: 0, right: 0, height: ITEM_H * 1.2, zIndex: 2 },
    item: { height: ITEM_H, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 14 },
    itemIcon: { fontSize: 28, width: 36, textAlign: 'center' },
    manualBtn: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 10, backgroundColor: C.surface + 'cc' },
    manualBtnInner: { paddingHorizontal: 40, paddingVertical: 16, borderRadius: 16 },
  });
}

export default function MissionRouletteScreen({ onStart, onSkip, autoSpin = true }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [result,          setResult]          = useState(null);
  const [showBtn,         setShowBtn]         = useState(false);
  const [rouletteKey,     setRouletteKey]     = useState(0);
  const [hasRetried,      setHasRetried]      = useState(false);
  const [missions,        setMissions]        = useState([]);
  const [loadingMissions, setLoadingMissions] = useState(true);
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const titleAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(titleAnim, {
      toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();

    api.get('/api/missions/weighted-pool')
      .then(data => { setMissions(data); setLoadingMissions(false); })
      .catch(() => {
        // weighted-pool 실패 시 기본 pool 폴백 (weight 없이 균등 확률)
        api.get('/api/missions/pool')
          .then(data => { setMissions(data); setLoadingMissions(false); })
          .catch(e => { console.warn('미션 풀 로딩 실패:', e); setLoadingMissions(false); });
      });
  }, []);

  const handleDone = (mission) => {
    setResult(mission);
    setShowBtn(true);
    Animated.timing(btnOpacity, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }).start();
  };

  const catColor = result ? getCategoryColor(result.category, C) : C.green;

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.header, {
        opacity: titleAnim,
        transform: [{ translateY: titleAnim.interpolate({ inputRange: [0,1], outputRange: [-20, 0] }) }],
      }]}>
        <T v="sub" style={{ letterSpacing: 1, marginBottom: 6 }}>매일 하나의 미션</T>
        <T v="heading" size={28} style={{ letterSpacing: 0.5 }}>
          {autoSpin ? '오늘의 미션 도착!' : '미션을 뽑을 시간!'}
        </T>
      </Animated.View>

      {result && (
        <View style={[styles.resultCard, { borderColor: catColor + '60', backgroundColor: catColor + '10' }]}>
          <Text style={styles.resultIcon}>{result.icon}</Text>
          <View style={styles.resultInfo}>
            <T v="label" color={catColor} style={{ marginBottom: 4, letterSpacing: 0.5 }}>{result.category} +1</T>
            <T v="body" size={16} style={{ lineHeight: 22 }}>{result.text}</T>
          </View>
        </View>
      )}

      <View style={styles.slotWrap}>
        {loadingMissions ? (
          <View style={styles.slotLoading}>
            <ActivityIndicator color={C.green} />
          </View>
        ) : (
          <SlotMachine key={rouletteKey} onDone={handleDone} autoSpin={autoSpin} missions={missions} />
        )}
      </View>

      <Animated.View style={[styles.btns, { opacity: btnOpacity }]}>
        {showBtn && (
          <>
            <TouchableOpacity onPress={() => onStart && onStart(result)} activeOpacity={0.85}>
              <LinearGradient colors={['#26d67a', '#1ab065']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.startBtn}>
                <T v="btn" size={17}>이 미션 시작하기 →</T>
              </LinearGradient>
            </TouchableOpacity>
            {!hasRetried && (
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={() => {
                  setResult(null); setShowBtn(false); btnOpacity.setValue(0);
                  setRouletteKey(k => k + 1); setHasRetried(true);
                }}
                activeOpacity={0.7}
              >
                <T v="sub" style={{ opacity: 0.6 }}>다시 돌리기</T>
              </TouchableOpacity>
            )}
          </>
        )}
        {!showBtn && <T v="body" style={{ opacity: 0.5 }}>{autoSpin ? '미션을 뽑는 중...' : '버튼을 눌러 미션을 뽑아보세요'}</T>}
      </Animated.View>

      <TouchableOpacity style={styles.closeBtn} onPress={onSkip} activeOpacity={0.7}>
        <T v="body" color={C.textSub}>✕</T>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen:         { flex: 1, backgroundColor: C.bg, paddingHorizontal: 24, justifyContent: 'center' },
    header:         { alignItems: 'center', marginBottom: 28 },
    resultCard:     { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, marginBottom: 16 },
    resultIcon:     { fontSize: 32 },
    resultInfo:     { flex: 1 },
    slotWrap:       { marginBottom: 28 },
    slotLoading:    { height: SLOT_H, borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
    btns:           { alignItems: 'center', gap: 12 },
    startBtn:       { width: width - 48, borderRadius: 16, paddingVertical: 17, alignItems: 'center' },
    skipBtn:        { paddingVertical: 10 },
    closeBtn: {
      position: 'absolute', top: 16, right: 24,
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
      alignItems: 'center', justifyContent: 'center',
    },
  });
}
