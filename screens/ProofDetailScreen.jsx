import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert,
} from 'react-native';
import { W } from '../constants/warm';
import { api, BASE_URL } from '../utils/api';
import WarmText from '../components/WarmText';
import * as H from '../utils/haptics';
import {
  RoomTopBar, MemberAvatar, ReactionBar, ProofStatusBadge, OutlineButton,
} from '../components/RoomBits';
import ReportReasonModal from '../components/ReportReasonModal';
import { pad } from '../utils/date';

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
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ProofDetailScreen({ roomId, proofId, missionTitle, isGroup = true, onBack, onChanged }) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);

  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [blocking, setBlocking] = useState(false);

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

  const handleReport = useCallback(async ({ reasonKey, detail }) => {
    setReportSubmitting(true);
    try {
      await api.post(`/api/v1/rooms/${roomId}/proofs/${proofId}/report`, { reason: reasonKey, detail: detail?.trim() || null });
      setReportOpen(false);
      Alert.alert('신고 접수', '신고가 접수되었어요.\n운영자가 확인 후 조치할게요.');
    } catch (e) {
      Alert.alert('신고 실패', e?.message || '신고를 접수하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setReportSubmitting(false);
    }
  }, [roomId, proofId]);

  const doBlock = useCallback(async () => {
    if (blocking) return;
    if (!proof?.authorUserId) {
      Alert.alert('차단 실패', '차단할 사용자를 확인할 수 없어요.');
      return;
    }
    setBlocking(true);
    try {
      await api.post(`/api/v1/users/${proof.authorUserId}/block`);
      H.success();
      Alert.alert('차단했어요', '이 사용자의 인증이 보이지 않아요.');
      onChanged?.();
      onBack?.();
    } catch (e) {
      Alert.alert('차단 실패', e?.message || '차단하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setBlocking(false);
    }
  }, [blocking, proof?.authorUserId, onChanged, onBack]);

  const confirmBlock = useCallback(() => {
    const name = proof?.authorNickname ?? '사용자';
    Alert.alert(
      `${name}님을 차단할까요?`,
      '차단하면 이 사용자의 인증이 더 이상 보이지 않아요.',
      [
        { text: '취소', style: 'cancel' },
        { text: '차단하기', style: 'destructive', onPress: doBlock },
      ],
    );
  }, [proof?.authorNickname, doBlock]);

  const handleMenu = useCallback(() => {
    H.tap();
    Alert.alert(
      proof?.authorNickname ?? '사용자',
      undefined,
      [
        { text: '신고하기', onPress: () => setReportOpen(true) },
        { text: '차단하기', style: 'destructive', onPress: confirmBlock },
        { text: '취소', style: 'cancel' },
      ],
    );
  }, [proof?.authorNickname, confirmBlock]);

  const photo = resolvePhoto(proof?.photoUrl);

  return (
    <View style={s.screen}>
      <RoomTopBar
        title="인증 상세"
        subtitle={missionTitle}
        subtitleColor={W.textSub}
        onBack={onBack}
        rightIcon={proof && !proof.mine ? 'ellipsis-horizontal' : undefined}
        onRight={handleMenu}
      />
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
            <View style={s.photoWrap}>
              {photo ? (
                <Image source={{ uri: photo }} style={s.photo} resizeMode="cover" />
              ) : (
                <View style={[s.photo, s.photoEmpty]}><WarmText size={52}>📷</WarmText></View>
              )}
              <View style={s.statusBadge}><ProofStatusBadge status={proof.status} /></View>
              <View style={s.authorOverlay}>
                <MemberAvatar avatarId={proof.authorAvatarId} size={32} />
                <WarmText v="section" size={14} color="#fff" style={{ flex: 1 }} numberOfLines={1}>
                  {proof.authorNickname}
                </WarmText>
                <WarmText v="sub" size={13} color="rgba(255,255,255,0.6)">{timeLabel(proof.createdAt)}</WarmText>
              </View>
            </View>

            <View style={s.cardBody}>
              {proof.caption ? <WarmText v="body" size={14} style={{ lineHeight: 21 }}>{proof.caption}</WarmText> : null}

              <View style={proof.caption ? { marginTop: 14 } : null}>
                <ReactionBar reactions={proof.reactions} onToggle={handleReact} />
              </View>

              {isGroup ? (
                <View style={s.confirmRow}>
                  <WarmText v="caption" size={12} color={C.text}>{proof.confirmCount ?? 0}/{proof.requiredConfirm ?? 0}명 인증</WarmText>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={proof.myConfirmed}
                    onPress={handleConfirm}
                    style={[s.confirmBtn, proof.myConfirmed && { borderColor: C.greenBorder, backgroundColor: C.greenFaint }]}
                  >
                    <WarmText v="caption" size={12} color={proof.myConfirmed ? C.green : C.text}>
                      {proof.myConfirmed ? '✓ 인증함' : '인증해주기'}
                    </WarmText>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>
      )}

      <ReportReasonModal
        visible={reportOpen}
        targetUser={proof?.authorNickname}
        submitting={reportSubmitting}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReport}
      />
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: C.bg },
    center:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    content: { padding: 20 },
    card:    { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.borderStrong, overflow: 'hidden' },
    photoWrap: { position: 'relative' },
    photo:   { width: '100%', height: 300, backgroundColor: C.surface2 },
    photoEmpty: { alignItems: 'center', justifyContent: 'center' },
    statusBadge: { position: 'absolute', top: 12, right: 12 },
    authorOverlay: {
      position: 'absolute', left: 0, right: 0, bottom: 0,
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, paddingVertical: 8,
    },
    cardBody: { padding: 14 },
    confirmRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(122,92,79,0.25)' },
    confirmBtn: { borderWidth: 1, borderColor: C.brown, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: C.neutralStrong },
  });
}
