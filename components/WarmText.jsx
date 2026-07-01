import React from 'react';
import { Text } from 'react-native';
import { W } from '../constants/warm';

/**
 * 웜 크림 리디자인 전용 텍스트 컴포넌트 (Gmarket Sans + 웜 팔레트).
 * 기존 `<T>`(Kkukkukk + ThemeContext)와 별개로, 웜 톤 화면에서 사용한다.
 * variant 표는 Rooms v2·프로필 등 웜 톤 화면의 텍스트 스타일과 맞춘다.
 */
const GL = 'GmarketSansLight';
const GM = 'GmarketSansMedium';

const VARIANTS = {
  logo: { fontFamily: GL, fontSize: 34, color: W.text, letterSpacing: -0.5 },
  heading: { fontFamily: GL, fontSize: 26, color: W.text },
  title: { fontFamily: GM, fontSize: 18, color: W.text },
  section: { fontFamily: GM, fontSize: 15, color: W.text },
  body: { fontFamily: GL, fontSize: 14, color: W.text },
  sub: { fontFamily: GL, fontSize: 13, color: W.textSub, lineHeight: 19 },
  label: { fontFamily: GM, fontSize: 12, color: W.textSub, letterSpacing: 1 },
  caption: { fontFamily: GL, fontSize: 11, color: W.textSub },
  mission: { fontFamily: GL, fontSize: 24, color: W.text, textAlign: 'center', lineHeight: 32 },
  btn: { fontFamily: GM, fontSize: 16, color: W.white },
};

export default function WarmText({ v = 'body', size, color, style, children, ...rest }) {
  const base = VARIANTS[v] ?? VARIANTS.body;
  const override = {};
  if (size) override.fontSize = size;
  if (color) override.color = color;
  return (
    <Text style={[base, override, style]} {...rest}>
      {children}
    </Text>
  );
}
