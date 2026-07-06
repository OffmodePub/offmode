import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const ITEM_H = 60;
export const VISIBLE = 3;
export const PICKER_H = ITEM_H * VISIBLE;

/**
 * 스크롤-스냅 휠 피커 (시간 선택용).
 *
 * @param items          표시할 값 배열 (예: 시/분 숫자)
 * @param selectedIndex  현재 선택된 인덱스
 * @param onChange       (index) => void — 스냅/탭으로 선택이 바뀔 때 호출
 * @param colors         { surface, greenBorder, greenFaint } 색 토큰 객체 (useColors() 결과 또는 W)
 * @param renderLabel    (val, selected) => node — 항목 텍스트 렌더러 (화면별 폰트/크기/색 결정)
 */
export default function WheelPicker({ items, selectedIndex, onChange, colors, renderLabel }) {
  const scrollRef          = useRef(null);
  const isProgrammatic     = useRef(false);
  const selectedIndexRef   = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex; // 매 렌더마다 최신값 유지

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
    <View style={s.wrap}>
      <View
        style={[s.highlight, { borderColor: colors.greenBorder, backgroundColor: colors.greenFaint }]}
        pointerEvents="none"
      />
      <LinearGradient colors={[colors.surface, colors.surface + '00']} style={[s.fade, { top: 0 }]}    pointerEvents="none" />
      <LinearGradient colors={[colors.surface + '00', colors.surface]} style={[s.fade, { bottom: 0 }]} pointerEvents="none" />
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
            style={s.item}
            activeOpacity={0.6}
            onPress={() => onChange(i)}
          >
            {renderLabel(val, i === selectedIndex)}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, position: 'relative', overflow: 'hidden', height: PICKER_H },
  highlight: {
    position: 'absolute', top: ITEM_H * 1, left: 0, right: 0, height: ITEM_H,
    borderTopWidth: 1, borderBottomWidth: 1, zIndex: 1, borderRadius: 8,
  },
  fade: { position: 'absolute', left: 0, right: 0, height: ITEM_H * 1.0, zIndex: 2 },
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
});
