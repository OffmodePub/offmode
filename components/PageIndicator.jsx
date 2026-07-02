import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { W } from '../constants/warm';

/**
 * 최상위 3페이지(Mission · Profile · Settings) 스와이프 페이지 인디케이터.
 * Figma 356:231 — 비활성 8x8 점(웜 border), 활성 20x8 그린 pill.
 * bg는 활성 페이지에 맞춰 호출부에서 전달(웜 페이지=웜 크림, 설정=테마 배경).
 */
export default function PageIndicator({ count = 3, active = 0, bg = W.bg }) {
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
    bar: { height: 33, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: bg },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: W.border },
    dotActive: { width: 20, backgroundColor: W.green },
  });
}
