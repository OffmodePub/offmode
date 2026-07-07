import React, { useMemo } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { W } from '../constants/warm';
import WarmText from '../components/WarmText';

export default function LoginScreen({ onKakaoLogin, onAppleLogin, loading, error }) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);

  return (
    <View style={s.screen}>

      {/* 상단 브랜딩 */}
      <View style={s.brand}>
        <LinearGradient
          colors={['#22c97a', '#1ab065']}
          style={s.logoCircle}
        >
          <WarmText style={s.logoMoon}>🌙</WarmText>
        </LinearGradient>
        <WarmText v="logo" style={s.logoText}>OFFMODE</WarmText>
        <WarmText v="sub" size={15} color={C.green} style={s.tagline}>
          매일 하나의 미션으로{'\n'}오프라인을 시작하세요
        </WarmText>
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
          <WarmText size={20}>💬</WarmText>
          <WarmText v="body" size={16} style={s.kakaoText}>
            {loading ? '로그인 중...' : '카카오로 시작하기'}
          </WarmText>
          <View style={{ width: 24 }} />
        </TouchableOpacity>

        {/* Apple (iOS only) */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={s.appleBtn}
            onPress={onAppleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            <WarmText size={18} color="#000000"></WarmText>
            <WarmText v="body" size={16} style={s.appleText}>
              {loading ? '로그인 중...' : 'Apple로 시작하기'}
            </WarmText>
            <View style={{ width: 24 }} />
          </TouchableOpacity>
        )}

        {!!error && <WarmText v="caption" color={C.coral} style={s.error}>{error}</WarmText>}

      </View>

      {/* 하단 약관 */}
      <WarmText v="caption" color={C.text} style={s.terms}>
        시작하면 서비스 이용약관 및{'\n'}개인정보 처리방침에 동의하는 것으로 간주됩니다
      </WarmText>

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

    brand: { alignItems: 'center', flex: 1, justifyContent: 'center', gap: 18 },

    logoCircle: {
      width: 80, height: 80, borderRadius: 40,
      alignItems: 'center', justifyContent: 'center',
    },
    logoMoon: { fontSize: 40 },
    logoText: { letterSpacing: 6 },
    tagline:  { textAlign: 'center', lineHeight: 22, opacity: 0.7 },

    btns: { width: '100%', gap: 12, marginBottom: 32 },

    /* 카카오 */
    kakaoBtn: {
      backgroundColor: '#FEE500',
      borderRadius: 16, height: 54,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8,
    },
    kakaoText: { color: 'rgba(0,0,0,0.85)', flex: 1, textAlign: 'center' },

    /* Apple */
    appleBtn: {
      backgroundColor: '#ffffff',
      borderWidth: 1, borderColor: '#000000',
      borderRadius: 16, height: 54,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8,
    },
    appleText: { color: '#000000', flex: 1, textAlign: 'center' },

    error: { textAlign: 'center', lineHeight: 18 },
    terms: { textAlign: 'center', lineHeight: 18, opacity: 0.4 },
  });
}
