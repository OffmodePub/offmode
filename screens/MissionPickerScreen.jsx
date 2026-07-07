import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator,
} from 'react-native';
import { W } from '../constants/warm';
import { api } from '../utils/api';
import WarmText from '../components/WarmText';
import * as H from '../utils/haptics';
import { RoomTopBar } from '../components/RoomBits';

export default function MissionPickerScreen({ roomId, onBack, onChosen }) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [custom, setCustom] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/api/v1/rooms/${roomId}/mission/candidates`);
      setCandidates(Array.isArray(res) ? res : []);
    } catch (e) {
      console.warn('미션 후보 로딩 실패:', e);
    }
  }, [roomId]);

  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]);

  const submit = useCallback(async (body) => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/api/v1/rooms/${roomId}/mission`, body);
      onChosen?.();
    } catch (e) {
      console.warn('미션 정하기 실패:', e);
      setError(e?.message || '미션을 정하지 못했어요.');
      setSubmitting(false);
    }
  }, [roomId, onChosen, submitting]);

  const canCustom = custom.trim().length > 0 && !submitting;

  return (
    <View style={s.screen}>
      <RoomTopBar title="미션 직접 입력하기" onBack={onBack} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <WarmText v="label" style={s.sectionLabel}>지난 미션에서 고르기</WarmText>
        {loading ? (
          <View style={s.center}><ActivityIndicator color={C.green} /></View>
        ) : candidates.length === 0 ? (
          <View style={s.feedEmpty}>
            <WarmText v="sub" style={{ textAlign: 'center' }}>직접 입력한 지난 미션이 아직 없어요</WarmText>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {candidates.map(m => (
              <TouchableOpacity
                key={m.id}
                activeOpacity={0.85}
                disabled={submitting}
                onPress={() => { H.tap(); submit({ source: 'DIRECT', title: m.title, icon: m.icon }); }}
                style={s.pickRow}
              >
                <WarmText size={22}>{m.icon}</WarmText>
                <WarmText v="body" size={15} style={{ flex: 1 }}>{m.title}</WarmText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <WarmText v="label" style={s.sectionLabel}>직접 입력하기</WarmText>
        <View style={{ gap: 12 }}>
          <TextInput
            value={custom}
            onChangeText={setCustom}
            placeholder="예) 좋아하는 노래 들으며 산책"
            placeholderTextColor={C.brown}
            maxLength={30}
            style={s.input}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={!canCustom}
            onPress={() => { H.success(); submit({ source: 'DIRECT', title: custom.trim(), icon: '✨' }); }}
            style={[s.outlineBtn, !canCustom && { opacity: 0.5 }]}
          >
            <WarmText v="section" size={16} color={C.green}>이 미션으로 정하기</WarmText>
          </TouchableOpacity>
        </View>

        {error ? <WarmText v="sub" color={C.coral} style={{ marginTop: 16, textAlign: 'center' }}>{error}</WarmText> : null}
      </ScrollView>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: C.bg },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    center:  { paddingVertical: 30, alignItems: 'center' },
    sectionLabel: { marginTop: 16, marginBottom: 10 },
    pickRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderStrong, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14 },
    input:   { backgroundColor: C.neutralSoft, borderWidth: 1, borderColor: C.borderStrong, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontFamily: 'GmarketSansLight', fontSize: 15, color: C.text },
    outlineBtn: { alignItems: 'center', justifyContent: 'center', borderRadius: 16, paddingVertical: 15, borderWidth: 1.5, borderColor: C.greenBorder, backgroundColor: C.greenFaint },
    feedEmpty: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border, paddingVertical: 24, alignItems: 'center' },
  });
}
