import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { W } from '../constants/warm';
import useBottomInset from '../utils/useBottomInset';

/** 페이지 인디케이터 바 높이 (Figma 356:231). */
export const PAGE_INDICATOR_HEIGHT = 33;

/**
 * 엣지-투-엣지 페이저에서 컨텐츠가 확보해야 할 하단 여백.
 * = 인디케이터 높이 + 하단 인셋(useBottomInset)
 * SafeAreaProvider 하위에서만 호출할 것.
 */
export function usePagerBottomBarHeight() {
  return PAGE_INDICATOR_HEIGHT + useBottomInset();
}

/**
 * 최상위 3페이지(Mission · Profile · Settings) 스와이프 페이지 인디케이터.
 * Figma 356:231 — 비활성 8x8 점(웜 border), 활성 20x8 그린 pill.
 * 엣지-투-엣지 플로팅 오버레이용으로 bg 기본값은 transparent.
 */
export default function PageIndicator({ count = 3, active = 0, bg = 'transparent' }) {
  const s = useMemo(() => makeStyles(bg), [bg]);
  return (
    <View style={s.bar}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[s.dot, i === active && s.dotActive]} />
      ))}
    </View>
  );
}

function makeStyles(bg) {
  return StyleSheet.create({
    bar: { height: PAGE_INDICATOR_HEIGHT, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: bg },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: W.border },
    dotActive: { width: 20, backgroundColor: W.green },
  });
}
