import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { W } from '../constants/warm';
import { api, BASE_URL } from '../utils/api';
import WarmText from '../components/WarmText';
import * as H from '../utils/haptics';
import {
  RoomTopBar, MemberAvatar, ReactionBar, ProofStatusBadge, OutlineButton,
} from '../components/RoomBits';

function resolvePhoto(url) {
  if (!url) return null;
  return url.startsWith('/') ? `${BASE_URL}${url}` : url;
}

function timeLabel(createdAt) {
  if (!createdAt) return '';
  const d = Array.isArray(createdAt)
    ? new Date(createdAt[0], (createdAt[1] || 1) - 1, createdAt[2] || 1, createdAt[3] || 0, createdAt[4] || 0)
    : new Date(createdAt);
  if (isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function ProofDetailScreen({ roomId, proofId, missionTitle, isGroup = true, onBack, onChanged }) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);

  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.get(`/api/v1/rooms/${roomId}/proofs/${proofId}`);
      setProof(res);
    } catch (e) {
      console.warn('인증 상세 로딩 실패:', e);
      setError(e?.message || '인증을 불러오지 못했어요.');
    }
  }, [roomId, proofId]);

  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]);

  const handleReact = useCallback(async (emoji) => {
    try {
      const updated = await api.post(`/api/v1/rooms/${roomId}/proofs/${proofId}/reactions`, { emoji });
      setProof(prev => prev ? { ...prev, reactions: updated ?? prev.reactions } : prev);
      onChanged?.();
    } catch (e) {
      console.warn('리액션 실패:', e);
    }
  }, [roomId, proofId, onChanged]);

  const handleConfirm = useCallback(async () => {
    H.success();
    try {
      const res = await api.post(`/api/v1/rooms/${roomId}/proofs/${proofId}/confirm`);
      setProof(prev => prev ? {
        ...prev,
        myConfirmed: true,
        confirmCount: res?.confirmCount ?? prev.confirmCount,
        requiredConfirm: res?.requiredConfirm ?? prev.requiredConfirm,
        status: res?.status ?? prev.status,
      } : prev);
      onChanged?.();
    } catch (e) {
      console.warn('피어 인증 실패:', e);
    }
  }, [roomId, proofId, onChanged]);

  const photo = resolvePhoto(proof?.photoUrl);

  return (
    <View style={s.screen}>
      <RoomTopBar title="인증 상세" subtitle={missionTitle} onBack={onBack} />
      {loading ? (
        <View style={s.center}><ActivityIndicator color={C.green} /></View>
      ) : error || !proof ? (
        <View style={s.center}>
          <WarmText v="sub" style={{ textAlign: 'center', marginBottom: 12 }}>{error || '인증을 찾을 수 없어요.'}</WarmText>
          <OutlineButton label="다시 시도" onPress={() => { setLoading(true); load().finally(() => setLoading(false)); }} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.card}>
            <View style={s.cardTop}>
              <MemberAvatar avatarId={proof.authorAvatarId} size={32} />
              <View style={{ flex: 1 }}>
                <WarmText v="section" size={14}>{proof.authorNickname}</WarmText>
                <WarmText v="caption" size={11}>{timeLabel(proof.createdAt)} 미션 완료</WarmText>
              </View>
              <ProofStatusBadge status={proof.status} />
            </View>

            {photo ? (
              <Image source={{ uri: photo }} style={s.photo} resizeMode="cover" />
            ) : (
              <View style={[s.photo, s.photoEmpty]}><WarmText size={52}>📷</WarmText></View>
            )}

            {proof.caption ? <WarmText v="body" size={15} style={{ marginTop: 12 }}>{proof.caption}</WarmText> : null}

            <View style={{ marginTop: 14 }}>
              <ReactionBar reactions={proof.reactions} onToggle={handleReact} />
            </View>

            {isGroup ? (
              <View style={s.confirmRow}>
                <WarmText v="caption" size={12}>{proof.confirmCount ?? 0}/{proof.requiredConfirm ?? 0}명 인증</WarmText>
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={proof.myConfirmed}
                  onPress={handleConfirm}
                  style={[s.confirmBtn, proof.myConfirmed && { borderColor: C.greenBorder, backgroundColor: C.greenFaint }]}
                >
                  <WarmText v="section" size={14} color={proof.myConfirmed ? C.green : C.text}>
                    {proof.myConfirmed ? '✓ 인증함' : '인증해주기'}
                  </WarmText>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: C.bg },
    center:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    content: { padding: 20 },
    card:    { backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 14 },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    photo:   { width: '100%', height: 300, borderRadius: 14, backgroundColor: C.surface2 },
    photoEmpty: { alignItems: 'center', justifyContent: 'center' },
    confirmRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border },
    confirmBtn: { borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9, backgroundColor: C.bg },
  });
}
