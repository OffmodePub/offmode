import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { W } from '../constants/warm';
import { api, BASE_URL } from '../utils/api';
import WarmText from '../components/WarmText';
import * as H from '../utils/haptics';
import {
  RoomTopBar, MemberAvatar, SourceBadge, ProgressBar, GreenButton, OutlineButton,
  ReactionBar, ProofStatusBadge,
} from '../components/RoomBits';
import { roomIconEmoji } from '../constants/rooms';

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

/* ── 인증 카드 ─────────────────────────────────────────── */
function ProofCard({ proof, isGroup, onReact, onPeerVerify, onOpen }) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);
  const photo = resolvePhoto(proof.photoUrl);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onOpen} style={s.proofCard}>
      <View style={s.proofTop}>
        <MemberAvatar avatarId={proof.authorAvatarId} size={30} />
        <View style={{ flex: 1 }}>
          <WarmText v="section" size={14}>{proof.authorNickname}</WarmText>
          <WarmText v="caption" size={11}>{timeLabel(proof.createdAt)} 미션 완료</WarmText>
        </View>
        <ProofStatusBadge status={proof.status} />
      </View>

      {photo ? (
        <Image source={{ uri: photo }} style={s.proofPhoto} resizeMode="cover" />
      ) : (
        <View style={[s.proofPhoto, s.proofPhotoEmpty]}><WarmText size={44}>📷</WarmText></View>
      )}

      {proof.caption ? <WarmText v="body" size={14} style={{ marginTop: 10 }}>{proof.caption}</WarmText> : null}

      <View style={s.proofFooter}>
        <ReactionBar reactions={proof.reactions} onToggle={(emoji) => onReact?.(proof.id, emoji)} />
      </View>

      {isGroup ? (
        <View style={s.confirmRow}>
          <WarmText v="caption" size={11}>{proof.confirmCount ?? 0}/{proof.requiredConfirm ?? 0}명 인증</WarmText>
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={proof.myConfirmed}
            onPress={() => { H.success(); onPeerVerify?.(proof.id); }}
            style={[s.confirmBtn, proof.myConfirmed && { borderColor: C.greenBorder, backgroundColor: C.greenFaint }]}
          >
            <WarmText v="caption" size={12} color={proof.myConfirmed ? C.green : C.text}>
              {proof.myConfirmed ? '✓ 인증함' : '인증해주기'}
            </WarmText>
          </TouchableOpacity>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'VERIFIED', label: '인증 완료' },
  { key: 'PENDING', label: '인증 대기' },
];

export default function RoomDetailScreen({
  roomId, onBack, onOpenSettings, onOpenMissionPicker, onOpenVerify,
  onOpenProof, onOpenHistory, onComplete, onChanged, version,
}) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.get(`/api/v1/rooms/${roomId}`);
      setRoom(res);
      // 전원 인증 완료 → 축하 화면 (중복 방지는 상위(App)에서 미션 id로 처리)
      const prog = res?.progress;
      if (res?.type === 'GROUP' && prog && prog.requiredCount > 0 && prog.verifiedCount >= prog.requiredCount) {
        const key = res?.todayMission?.id ?? null;
        onComplete?.({ name: res.name, iconKey: res.iconKey, members: res.members, streak: res.streak }, key);
      }
    } catch (e) {
      console.warn('방 상세 로딩 실패:', e);
      setError(e?.message || '방 정보를 불러오지 못했어요.');
    }
  }, [roomId, onComplete]);

  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load, version]);

  const handleRandom = useCallback(async () => {
    H.tap();
    try {
      await api.post(`/api/v1/rooms/${roomId}/mission`, { source: 'RANDOM' });
      await load();
      onChanged?.();
    } catch (e) {
      console.warn('랜덤 미션 실패:', e);
    }
  }, [roomId, load, onChanged]);

  const handleReact = useCallback(async (proofId, emoji) => {
    try {
      const updated = await api.post(`/api/v1/rooms/${roomId}/proofs/${proofId}/reactions`, { emoji });
      // 응답(갱신된 reactions[])으로 해당 proof만 부분 갱신
      setRoom(prev => prev ? {
        ...prev,
        proofs: (prev.proofs ?? []).map(p => p.id === proofId ? { ...p, reactions: updated ?? p.reactions } : p),
      } : prev);
    } catch (e) {
      console.warn('리액션 실패:', e);
    }
  }, [roomId]);

  const handlePeerVerify = useCallback(async (proofId) => {
    try {
      await api.post(`/api/v1/rooms/${roomId}/proofs/${proofId}/confirm`);
      await load();
      onChanged?.();
    } catch (e) {
      console.warn('피어 인증 실패:', e);
    }
  }, [roomId, load, onChanged]);

  if (loading) {
    return (
      <View style={[s.screen, s.center]}>
        <ActivityIndicator color={C.green} />
      </View>
    );
  }

  if (error || !room) {
    return (
      <View style={s.screen}>
        <RoomTopBar title="방" onBack={onBack} />
        <View style={s.center}>
          <WarmText v="sub" style={{ textAlign: 'center', marginBottom: 12 }}>{error || '방 정보를 찾을 수 없어요.'}</WarmText>
          <OutlineButton label="다시 시도" onPress={() => { setLoading(true); load().finally(() => setLoading(false)); }} />
        </View>
      </View>
    );
  }

  const solo = room.type === 'SOLO';
  const mission = room.todayMission;
  const status = room.myTodayStatus; // NONE / PENDING / DONE
  const prog = room.progress ?? { verifiedCount: 0, requiredCount: room.memberCount ?? 0 };

  const pendingMembers = (room.members ?? []).filter(m => m.todayStatus !== 'DONE');
  const proofs = room.proofs ?? [];
  const filtered = filter === 'all' ? proofs : proofs.filter(p => p.status === filter);

  return (
    <View style={s.screen}>
      <RoomTopBar
        title={`${roomIconEmoji(room.iconKey)} ${room.name}`}
        subtitle={solo ? '혼자 하는 방' : `멤버 ${room.memberCount}명`}
        onBack={onBack}
        rightIcon="settings-outline"
        onRight={() => { H.tap(); onOpenSettings?.(); }}
      />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* 상단 미션 요약 바 */}
        {mission ? (
          <View style={s.summaryBar}>
            <View style={s.missionRow}>
              <WarmText size={18}>{mission.icon}</WarmText>
              <WarmText v="body" size={14} numberOfLines={1} style={{ flex: 1 }}>{mission.title}</WarmText>
            </View>
            <View style={{ marginTop: 10 }}>
              {solo ? (
                <ProgressBar value={status === 'DONE' ? 1 : 0} total={1} showLabel={false} />
              ) : (
                <ProgressBar value={prog.verifiedCount} total={prog.requiredCount} showLabel={false} />
              )}
            </View>
            <WarmText v="caption" size={11} color={C.green} style={{ marginTop: 8 }}>
              {solo
                ? (status === 'DONE' ? '오늘 미션 인증 완료' : '아직 인증 전이에요')
                : `${prog.verifiedCount}명 / ${prog.requiredCount}명 인증 완료`}
            </WarmText>
          </View>
        ) : null}

        {/* 오늘의 미션 */}
        {mission ? (
          <View style={s.section}>
            <View style={s.sectionHead}>
              <WarmText v="section" size={15}>오늘의 미션</WarmText>
              <SourceBadge source={mission.source} />
            </View>
            <View style={s.missionCard}>
              <View style={s.missionIconBox}><WarmText size={34}>{mission.icon}</WarmText></View>
              <WarmText v="mission" size={24} style={{ marginTop: 14, marginBottom: 16 }}>{mission.title}</WarmText>
              {status === 'DONE' ? (
                <View style={s.doneBanner}><WarmText v="section" size={15} color={C.green}>✓  인증 완료!</WarmText></View>
              ) : status === 'PENDING' ? (
                <View style={s.doneBanner}><WarmText v="section" size={15} color={C.green}>인증 대기 중…</WarmText></View>
              ) : (
                <GreenButton label="인증하기" ionicon="camera-outline" onPress={() => { H.tap(); onOpenVerify?.(room); }} style={{ width: '100%' }} />
              )}
            </View>
          </View>
        ) : (
          /* 미션 미정 (Empty) */
          <View style={s.emptyMission}>
            <View style={s.emptyIcon}><WarmText size={30}>🎲</WarmText></View>
            <WarmText v="title" size={18} style={{ marginTop: 14 }}>오늘의 미션이 아직 없어요</WarmText>
            <WarmText v="sub" style={{ textAlign: 'center', marginTop: 6, marginBottom: 20 }}>
              {solo ? '오늘의 미션을 정해보세요' : '미션을 정하면 멤버 모두에게 알림이 가요'}
            </WarmText>
            <GreenButton label="랜덤 미션 뽑기" ionicon="dice-outline" onPress={handleRandom} style={{ width: '100%', marginBottom: 10 }} />
            <OutlineButton label="직접 정하기" ionicon="create-outline" onPress={() => { H.tap(); onOpenMissionPicker?.(); }} style={{ width: '100%' }} />
          </View>
        )}

        {/* 수행 중 멤버 (그룹) */}
        {!solo && mission && pendingMembers.length > 0 ? (
          <View style={s.section}>
            <View style={s.sectionHead}>
              <WarmText v="section" size={15}>수행 중</WarmText>
              <WarmText v="caption">{pendingMembers.length}명 미인증</WarmText>
            </View>
            <View style={{ gap: 8 }}>
              {pendingMembers.map(m => (
                <View key={m.memberId} style={s.pendingRow}>
                  <MemberAvatar avatarId={m.avatarId} size={30} />
                  <WarmText v="body" size={14} style={{ flex: 1 }}>{m.nickname}</WarmText>
                  <WarmText v="caption" size={11} color={m.todayStatus === 'PENDING' ? C.green : C.textSub}>
                    {m.todayStatus === 'PENDING' ? '인증 대기' : '미인증'}
                  </WarmText>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* 인증 피드 */}
        {mission && (proofs.length > 0 || !solo) ? (
          <View style={s.section}>
            <View style={s.sectionHead}>
              <WarmText v="section" size={15}>{solo ? '오늘의 인증' : '오늘의 인증'}</WarmText>
              {!solo ? (
                <TouchableOpacity onPress={() => { H.tap(); onOpenHistory?.(); }} activeOpacity={0.7}>
                  <WarmText v="caption" color={C.green}>지난 기록 보기</WarmText>
                </TouchableOpacity>
              ) : null}
            </View>

            {!solo ? (
              <View style={s.filterRow}>
                {FILTERS.map(f => {
                  const active = filter === f.key;
                  return (
                    <TouchableOpacity
                      key={f.key}
                      activeOpacity={0.8}
                      onPress={() => { H.tap(); setFilter(f.key); }}
                      style={[s.filterChip, active && { borderColor: C.greenBorder, backgroundColor: C.greenFaint }]}
                    >
                      <WarmText v="caption" size={12} color={active ? C.green : C.textSub}>{f.label}</WarmText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}

            {filtered.length === 0 ? (
              <View style={s.feedEmpty}>
                <WarmText size={26} style={{ marginBottom: 6 }}>🫶</WarmText>
                <WarmText v="sub" style={{ textAlign: 'center' }}>아직 인증이 없어요{'\n'}첫 인증의 주인공이 되어보세요</WarmText>
              </View>
            ) : (
              <View style={{ gap: 14 }}>
                {filtered.map(p => (
                  <ProofCard
                    key={p.id}
                    proof={p}
                    isGroup={!solo}
                    onReact={handleReact}
                    onPeerVerify={handlePeerVerify}
                    onOpen={() => { H.tap(); onOpenProof?.({ proofId: p.id, missionTitle: mission?.title, isGroup: !solo }); }}
                  />
                ))}
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: C.bg },
    center:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    content: { paddingBottom: 40 },

    summaryBar: { marginHorizontal: 20, marginTop: 4, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14 },
    missionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

    section:     { marginHorizontal: 20, marginTop: 16, backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 18 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },

    missionCard:  { alignItems: 'center', backgroundColor: C.bg, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 20 },
    missionIconBox: { width: 80, height: 80, borderRadius: 20, backgroundColor: C.greenFaint, borderWidth: 1, borderColor: C.greenBorder, alignItems: 'center', justifyContent: 'center' },
    doneBanner:   { width: '100%', borderWidth: 1, borderColor: C.greenBorder, backgroundColor: C.greenFaint, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },

    emptyMission: { marginHorizontal: 20, marginTop: 16, backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border, paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center' },
    emptyIcon:    { width: 70, height: 70, borderRadius: 35, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },

    pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },

    filterRow:  { flexDirection: 'row', gap: 8, marginBottom: 14 },
    filterChip: { borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.bg },

    feedEmpty:  { backgroundColor: C.bg, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border, paddingVertical: 26, alignItems: 'center' },

    proofCard:  { backgroundColor: C.bg, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 12 },
    proofTop:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    proofPhoto: { width: '100%', height: 200, borderRadius: 12, backgroundColor: C.surface2 },
    proofPhotoEmpty: { alignItems: 'center', justifyContent: 'center' },
    proofFooter: { marginTop: 12 },
    confirmRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
    confirmBtn: { borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: C.surface },
  });
}
