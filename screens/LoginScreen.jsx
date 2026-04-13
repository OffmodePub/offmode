import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../utils/useColors';
import T from '../components/ThemedText';

const F = 'Kkukkukk';

export default function LoginScreen({ onKakaoLogin, onAppleLogin, loading }) {
  const C = useColors();
  const s = useMemo(() => makeStyles(C), [C]);

  return (
    <View style={s.screen}>

      {/* 상단 브랜딩 */}
      <View style={s.brand}>
        <View style={s.logoWrap}>
          <LinearGradient
            colors={['#22c97a', '#1ab065']}
            style={s.logoCircle}
          >
            <Text style={s.logoMoon}>🌙</Text>
          </LinearGradient>
        </View>
        <T v="logo" size={36} style={s.logoText}>OFFMODE</T>
        <T v="sub" style={s.tagline}>
          매일 하나의 미션으로{'\n'}오프라인을 시작하세요
        </T>
      </View>

      {/* 로그인 버튼들 */}
      <View style={s.btns}>

        {/* 카카오 */}
        <TouchableOpacity
          style={s.kakaoBtn}
          onPress={onKakaoLogin}
          activeOpacity={0.85}
          disabled={loading}
        >
          <Text style={s.kakaoIcon}>💬</Text>
          <Text style={s.kakaoText}>카카오로 시작하기</Text>
          <View style={{ width: 24 }} />
        </TouchableOpacity>

        {/* Apple (iOS only) */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={[s.appleBtn, { backgroundColor: C.isDark ? '#ffffff' : '#000000' }]}
            onPress={onAppleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={[s.appleIcon, { color: C.isDark ? '#000' : '#fff' }]}></Text>
            <Text style={[s.appleText, { color: C.isDark ? '#000' : '#fff' }]}>
              Apple로 시작하기
            </Text>
            <View style={{ width: 24 }} />
          </TouchableOpacity>
        )}

      </View>

      {/* 하단 약관 */}
      <T v="caption" style={s.terms}>
        시작하면 서비스 이용약관 및{'\n'}개인정보 처리방침에 동의하는 것으로 간주됩니다
      </T>

    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen: {
      flex: 1, backgroundColor: C.bg,
      alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 28, paddingTop: 100, paddingBottom: 48,
    },

    brand: { alignItems: 'center', flex: 1, justifyContent: 'center' },

    logoWrap:   { marginBottom: 20 },
    logoCircle: {
      width: 80, height: 80, borderRadius: 40,
      alignItems: 'center', justifyContent: 'center',
    },
    logoMoon: { fontSize: 40 },
    logoText: { letterSpacing: 6, marginBottom: 16 },
    tagline:  {
      textAlign: 'center', lineHeight: 22, opacity: 0.7,
      fontFamily: F, fontSize: 15,
    },

    btns: { width: '100%', gap: 12, marginBottom: 32 },

    /* 카카오 */
    kakaoBtn: {
      backgroundColor: '#FEE500',
      borderRadius: 16, height: 54,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8,
    },
    kakaoIcon: { fontSize: 20 },
    kakaoText: { fontFamily: F, fontSize: 16, color: 'rgba(0,0,0,0.85)', flex: 1, textAlign: 'center' },

    /* Apple */
    appleBtn: {
      borderRadius: 16, height: 54,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8,
    },
    appleIcon: { fontSize: 18, fontFamily: F },
    appleText: { fontFamily: F, fontSize: 16, flex: 1, textAlign: 'center' },

    terms: { textAlign: 'center', lineHeight: 18, opacity: 0.4 },
  });
}
