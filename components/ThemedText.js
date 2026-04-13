import { Text } from 'react-native';
import { useColors } from '../utils/useColors';

const F = 'Kkukkukk';

export default function T({ v = 'body', size, color, style, children, ...rest }) {
  const C = useColors();
  const variants = {
    logo:    { fontFamily: F, fontSize: 34, color: C.green,   fontStyle: 'italic', letterSpacing: -0.5 },
    heading: { fontFamily: F, fontSize: 26, color: C.text,    lineHeight: 34 },
    title:   { fontFamily: F, fontSize: 20, color: C.text },
    section: { fontFamily: F, fontSize: 15, color: C.text },
    body:    { fontFamily: F, fontSize: 14, color: C.text },
    sub:     { fontFamily: F, fontSize: 13, color: C.textSub },
    label:   { fontFamily: F, fontSize: 12, color: C.textSub },
    caption: { fontFamily: F, fontSize: 11, color: C.textSub },

    green:   { fontFamily: F, fontSize: 14, color: C.green },
    purple:  { fontFamily: F, fontSize: 14, color: C.purple },
    blue:    { fontFamily: F, fontSize: 14, color: C.blue },
    green16:    { fontFamily: F, fontSize: 16, color: C.green },

    mission: { fontFamily: F, fontSize: 26, color: C.text,    lineHeight: 36, textAlign: 'center' },
    stat:    { fontFamily: F, fontSize: 32, color: C.text,    lineHeight: 38 },
    btn:     { fontFamily: F, fontSize: 16, color: '#000' },
    ticker:  { fontFamily: F, fontSize: 13, color: C.green,   letterSpacing: 0.4, opacity: 0.85 },
  };
  const base = variants[v] ?? variants.body;
  const override = {};
  if (size)  override.fontSize = size;
  if (color) override.color    = color;
  return <Text style={[base, override, style]} {...rest}>{children}</Text>;
}
