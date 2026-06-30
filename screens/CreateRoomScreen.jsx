import React, { useMemo, useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { W } from '../constants/warm';
import { api } from '../utils/api';
import WarmText from '../components/WarmText';
import * as H from '../utils/haptics';
import { RoomTopBar, GreenButton } from '../components/RoomBits';
import { ROOM_ICON_KEYS, roomIconEmoji } from '../constants/rooms';

export default function CreateRoomScreen({ onBack, onCreated }) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);

  const [name, setName] = useState('');
  const [iconKey, setIconKey] = useState('FIRE');
  const [type, setType] = useState('GROUP');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canCreate = name.trim().length > 0 && !submitting;

  const handleCreate = async () => {
    if (!canCreate) return;
    H.success();
    setSubmitting(true);
    setError('');
    try {
      const room = await api.post('/api/v1/rooms', { name: name.trim(), iconKey, type });
      onCreated?.(room);
    } catch (e) {
      console.warn('방 생성 실패:', e);
      setError(e?.message || '방을 만들지 못했어요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={s.screen}>
      <RoomTopBar title="새 방 만들기" onBack={onBack} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.field}>
          <WarmText v="label" style={s.label}>방 이름</WarmText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="예) 우리 동네 갓생러"
            placeholderTextColor={C.textSub}
            maxLength={16}
            style={s.input}
          />
        </View>

        <View style={s.field}>
          <WarmText v="label" style={s.label}>방 아이콘</WarmText>
          <View style={s.iconGrid}>
            {ROOM_ICON_KEYS.map(key => {
              const active = iconKey === key;
              return (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.8}
                  onPress={() => { H.tap(); setIconKey(key); }}
                  style={[s.iconCell, active && { borderColor: C.greenBorder, backgroundColor: C.greenFaint }]}
                >
                  <WarmText size={24}>{roomIconEmoji(key)}</WarmText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={s.field}>
          <WarmText v="label" style={s.label}>누구와 함께하나요?</WarmText>
          <View style={s.segmented}>
            {[
              { value: 'SOLO', emoji: '🌙', label: '나 혼자', desc: '개인 미션 방' },
              { value: 'GROUP', emoji: '👥', label: '친구와', desc: '함께 인증' },
            ].map(opt => {
              const active = type === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  activeOpacity={0.8}
                  onPress={() => { H.tap(); setType(opt.value); }}
                  style={[s.segItem, active && { borderColor: C.greenBorder, backgroundColor: C.greenFaint }]}
                >
                  <WarmText size={20} style={{ marginBottom: 4 }}>{opt.emoji}</WarmText>
                  <WarmText v="body" size={14} color={active ? C.green : C.text}>{opt.label}</WarmText>
                  <WarmText v="caption" size={11} style={{ marginTop: 2 }}>{opt.desc}</WarmText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {type === 'GROUP' ? (
          <View style={s.inviteCard}>
            <WarmText v="section" size={14} style={{ marginBottom: 4 }}>🔗 친구 초대</WarmText>
            <WarmText v="sub" size={13}>방을 만든 뒤 초대코드를 공유하면 친구가 참여할 수 있어요.</WarmText>
          </View>
        ) : null}

        {error ? <WarmText v="sub" color={C.coral} style={{ marginTop: 16 }}>{error}</WarmText> : null}
      </ScrollView>

      <View style={s.bottom}>
        <GreenButton label="방 만들기" onPress={handleCreate} disabled={!canCreate} />
      </View>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: C.bg },
    content: { paddingHorizontal: 20, paddingBottom: 40, gap: 24 },
    field:   { gap: 8 },
    label:   { marginBottom: 2 },
    input:   { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontFamily: 'GmarketSansLight', fontSize: 15, color: C.text },
    iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    iconCell: { width: 52, height: 52, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    segmented: { flexDirection: 'row', gap: 10 },
    segItem:   { flex: 1, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    inviteCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16 },
    bottom:    { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border },
  });
}
