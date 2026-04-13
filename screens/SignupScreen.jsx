import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Keyboard, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../utils/useColors';
import T from '../components/ThemedText';
import * as H from '../utils/haptics';

const F = 'Kkukkukk';
const AVATARS = ['🏃','🚴','🧘','🏊','💪','🎯','🔥','⚡','🌙','🦁','🐺','🦊','📚','🎮','🌅','🎸'];

export default function SignupScreen({ defaultName = '', onComplete }) {
  const C = useColors();
  const s = useMemo(() => makeStyles(C), [C]);

  const [name,   setName]   = useState(defaultName);
  const [avatar, setAvatar] = useState('🏃');

  const canSubmit = name.trim().length > 0;

  const handleDone = () => {
    if (!canSubmit) return;
    Keyboard.dismiss();
    H.success();
    onComplete({ name: name.trim(), avatar });
  };

  return (
    <View style={s.screen}>
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* 헤더 */}
        <View style={s.header}>
          <T v="logo" size={22} style={{ letterSpacing: 4, marginBottom: 8 }}>OFFMODE</T>
          <T v="title" size={22}>프로필을 설정해요</T>
          <T v="sub" style={{ marginTop: 8, textAlign: 'center' }}>
            나중에 설정에서 변경할 수 있어요
          </T>
        </View>

        {/* 아바타 미리보기 */}
        <View style={s.previewRow}>
          <LinearGradient colors={['#22c97a', '#1ab065']} style={s.previewAvatar}>
            <Text style={s.previewEmoji}>{avatar}</Text>
          </LinearGradient>
        </View>

        {/* 아바타 선택 */}
        <T v="label" style={s.sectionLabel}>아바타 선택</T>
        <View style={s.avatarGrid}>
          {AVATARS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[s.avatarCell, avatar === emoji && s.avatarCellActive]}
              onPress={() => { H.tap(); setAvatar(emoji); }}
              activeOpacity={0.7}
            >
              <Text style={s.avatarEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 닉네임 */}
        <T v="label" style={s.sectionLabel}>닉네임</T>
        <View style={s.inputWrap}>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="닉네임 입력 (최대 12자)"
            placeholderTextColor={C.textSub}
            maxLength={12}
            returnKeyType="done"
            onSubmitEditing={handleDone}
          />
          <T v="caption" style={{ opacity: 0.4 }}>{name.length}/12</T>
        </View>

        {/* 시작 버튼 */}
        <TouchableOpacity onPress={handleDone} activeOpacity={0.85} disabled={!canSubmit}>
          <LinearGradient
            colors={canSubmit ? ['#26d67a', '#1ab065'] : [C.surface2, C.surface2]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.startBtn}
          >
            <T v="btn" style={{ color: canSubmit ? '#000' : C.textSub }}>
              시작하기 →
            </T>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: C.bg },
    content: { paddingHorizontal: 28, paddingTop: 60, paddingBottom: 48 },

    header: { alignItems: 'center', marginBottom: 32 },

    previewRow:    { alignItems: 'center', marginBottom: 28 },
    previewAvatar: {
      width: 88, height: 88, borderRadius: 44,
      alignItems: 'center', justifyContent: 'center',
    },
    previewEmoji: { fontSize: 44 },

    sectionLabel: { marginBottom: 12, opacity: 0.6, letterSpacing: 1 },

    avatarGrid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28,
    },
    avatarCell: {
      width: 52, height: 52, borderRadius: 14,
      backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarCellActive: { borderColor: C.green, backgroundColor: C.greenFaint },
    avatarEmoji: { fontSize: 26 },

    inputWrap: {
      backgroundColor: C.surface, borderRadius: 14,
      borderWidth: 1, borderColor: C.border,
      paddingHorizontal: 16, paddingVertical: 14,
      flexDirection: 'row', alignItems: 'center', marginBottom: 28,
    },
    input: {
      flex: 1, fontFamily: F, fontSize: 16, color: C.text,
    },

    startBtn: {
      borderRadius: 16, paddingVertical: 18, alignItems: 'center',
    },
  });
}
