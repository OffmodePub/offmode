import React, { useMemo, useState } from 'react';
import {
  View, StyleSheet, ScrollView, TextInput,
} from 'react-native';
import { W } from '../constants/warm';
import { api } from '../utils/api';
import WarmText from '../components/WarmText';
import * as H from '../utils/haptics';
import useBottomInset from '../utils/useBottomInset';
import { RoomTopBar, GreenButton } from '../components/RoomBits';

export default function JoinRoomScreen({ onBack, onJoined, initialCode }) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);
  const bottomInset = useBottomInset();

  const [code, setCode] = useState(initialCode ? String(initialCode).toUpperCase() : '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const trimmed = code.trim().toUpperCase();
  const canJoin = trimmed.length >= 4 && !submitting;

  const handleJoin = async () => {
    if (!canJoin) return;
    H.success();
    setSubmitting(true);
    setError('');
    try {
      const room = await api.post('/api/v1/rooms/join', { inviteCode: trimmed });
      onJoined?.(room);
    } catch (e) {
      console.warn('방 참여 실패:', e);
      setError(e?.message || '이 코드로 방을 찾지 못했어요. 코드를 다시 확인해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={s.screen}>
      <RoomTopBar title="초대코드로 참여" onBack={onBack} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 8 }}>
          <WarmText v="label">초대코드</WarmText>
          <TextInput
            value={code}
            onChangeText={(t) => { setCode(t.toUpperCase()); setError(''); }}
            placeholder="예) OFF111"
            placeholderTextColor={C.brown}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            style={[s.input, { letterSpacing: 2 }]}
          />
          <WarmText v="caption" color={C.text} style={{ marginTop: 4 }}>친구에게 받은 6자리 코드를 입력해주세요</WarmText>
        </View>

        {error ? (
          <View style={s.errorBox}>
            <WarmText v="sub" color={C.coral} style={{ textAlign: 'center' }}>{error}</WarmText>
          </View>
        ) : null}
      </ScrollView>

      <View style={[s.bottom, { paddingBottom: bottomInset }]}>
        <GreenButton label="참여하기" onPress={handleJoin} disabled={!canJoin} />
      </View>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: C.bg },
    content: { paddingHorizontal: 20, paddingBottom: 40, gap: 20 },
    input:   { backgroundColor: C.neutralSoft, borderWidth: 1, borderColor: C.borderStrong, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontFamily: 'GmarketSansLight', fontSize: 15, color: C.text },
    errorBox: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingVertical: 18, paddingHorizontal: 16 },
    bottom:  { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, backgroundColor: C.bg },
  });
}
