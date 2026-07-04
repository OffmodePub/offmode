import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, StyleSheet, TouchableOpacity,
  Animated, Easing, Dimensions, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { W, catColorsW } from '../constants/warm';
import { api } from '../utils/api';
import WarmText from '../components/WarmText';

const { width } = Dimensions.get('window');

const ITEM_H  = 80;
const VISIBLE = 3;
const REPEATS = 6;
const SLOT_H  = ITEM_H * VISIBLE;

function SlotMachine({ onDone, autoSpin = true, missions }) {
  const C = W;
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
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start(() => {
      translateY.setValue(targetY);
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
      <LinearGradient colors={[C.bg, C.bg + '00']} style={[slot.fade, { top: 0 }]}    pointerEvents="none" />
      <LinearGradient colors={[C.bg + '00', C.bg]} style={[slot.fade, { bottom: 0 }]} pointerEvents="none" />
      <View style={slot.highlight} pointerEvents="none" />
      <View style={slot.window}>
        <Animated.View style={{ transform: [{ translateY }] }}>
          {ITEMS.map((m, i) => {
            const isSelected = landed && i === ((REPEATS - 2) * missions.length + (finalIdx ?? 0));
            return (
              <View key={i} style={slot.item}>
                <WarmText style={slot.itemIcon}>{m.icon}</WarmText>
                <WarmText
                  v="body"
                  size={15}
                  style={[
                    { flex: 1, lineHeight: 22 },
                    isSelected
                      ? { color: catColorsW(m.category).main }
                      : { color: C.text, opacity: 0.55 },
                  ]}
                  numberOfLines={2}
                >
                  {m.text}
                </WarmText>
              </View>
            );
          })}
        </Animated.View>
      </View>

      {/* 수동 모드: 아직 돌리기 전 버튼 */}
      {!autoSpin && !started && (
        <TouchableOpacity onPress={spin} style={slot.manualBtn} activeOpacity={0.8}>
          <View style={slot.manualBtnInner}>
            <WarmText v="btn">🎰  돌리기</WarmText>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

function makeSlotStyles(C) {
  return StyleSheet.create({
    root: {
      height: SLOT_H, overflow: 'hidden',
      borderRadius: 16, borderWidth: 1, borderColor: C.green, backgroundColor: C.bg,
    },
    window:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
    highlight: {
      position: 'absolute', top: ITEM_H, left: 0, right: 0, height: ITEM_H,
      borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.green,
      backgroundColor: C.greenSoft, zIndex: 1,
    },
    fade: { position: 'absolute', left: 0, right: 0, height: ITEM_H * 1.2, zIndex: 2 },
    item: { height: ITEM_H, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 14 },
    itemIcon: { fontSize: 28, width: 36, textAlign: 'center' },
    manualBtn: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 10, backgroundColor: C.bg + 'cc' },
    manualBtnInner: { paddingHorizontal: 40, paddingVertical: 16, borderRadius: 16, backgroundColor: C.green },
  });
}

export default function MissionRouletteScreen({ onStart, onSkip, autoSpin = true }) {
  const C = W;
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

    api.get('/api/v1/missions/weighted-pool')
      .then(data => { setMissions(data); setLoadingMissions(false); })
      .catch(() => {
        // weighted-pool 실패 시 기본 pool 폴백 (weight 없이 균등 확률)
        api.get('/api/v1/missions/pool')
          .then(data => { setMissions(data); setLoadingMissions(false); })
          .catch(e => { console.warn('미션 풀 로딩 실패:', e); setLoadingMissions(false); });
      });
  }, []);

  const handleDone = (mission) => {
    setResult(mission);
    setShowBtn(true);
    Animated.timing(btnOpacity, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }).start();
  };

  const catW = catColorsW(result?.category);

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.header, {
        opacity: titleAnim,
        transform: [{ translateY: titleAnim.interpolate({ inputRange: [0,1], outputRange: [-20, 0] }) }],
      }]}>
        <WarmText v="sub" color={C.green} style={{ letterSpacing: 1, marginBottom: 6 }}>매일 하나의 미션</WarmText>
        <WarmText v="heading" size={28} style={{ letterSpacing: 0.5 }}>랜덤 미션 뽑기</WarmText>
      </Animated.View>

      {result && (
        <View style={[styles.resultCard, { borderColor: catW.main, backgroundColor: catW.border }]}>
          <WarmText style={styles.resultIcon}>{result.icon}</WarmText>
          <View style={styles.resultInfo}>
            <WarmText v="body" size={16} style={{ lineHeight: 22 }}>{result.text}</WarmText>
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
              <View style={styles.startBtn}>
                <WarmText v="btn" size={17}>이 미션으로 정하기</WarmText>
              </View>
            </TouchableOpacity>
            {!hasRetried && (
              <TouchableOpacity
                style={styles.skipBtn}
                hitSlop={10}
                onPress={() => {
                  setResult(null); setShowBtn(false); btnOpacity.setValue(0);
                  setRouletteKey(k => k + 1); setHasRetried(true);
                }}
                activeOpacity={0.7}
              >
                <WarmText v="section" size={13} style={{ opacity: 0.6 }}>다시 돌리기</WarmText>
              </TouchableOpacity>
            )}
          </>
        )}
        {!showBtn && (
          <WarmText v="body" style={{ opacity: 0.5 }}>
            {autoSpin ? '미션을 뽑는 중...' : '버튼을 눌러 미션을 뽑아보세요'}
          </WarmText>
        )}
      </Animated.View>

      <TouchableOpacity style={styles.closeBtn} onPress={onSkip} activeOpacity={0.7}>
        <WarmText size={20} color={C.text}>✕</WarmText>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen:         { flex: 1, backgroundColor: C.bg, paddingHorizontal: 24, justifyContent: 'center' },
    header:         { alignItems: 'center', marginBottom: 28 },
    resultCard:     { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, marginBottom: 60 },
    resultIcon:     { fontSize: 32 },
    resultInfo:     { flex: 1 },
    slotWrap:       { marginBottom: 50 },
    slotLoading:    { height: SLOT_H, borderRadius: 16, borderWidth: 1, borderColor: C.green, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
    btns:           { alignItems: 'center', gap: 30 },
    startBtn:       { width: width - 48, borderRadius: 16, paddingVertical: 17, alignItems: 'center', backgroundColor: C.green + 'cc' },
    skipBtn:        { paddingVertical: 0 },
    closeBtn: {
      position: 'absolute', top: 16, right: 24,
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
    },
  });
}
