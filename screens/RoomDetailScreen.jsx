import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { W } from '../constants/warm';
import { api, BASE_URL } from '../utils/api';
import WarmText from '../components/WarmText';
import * as H from '../utils/haptics';
import {
  RoomTopBar, MemberAvatar, SourceBadge, GreenButton, OutlineButton,
  ReactionBar, NudgeChip,
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

function reactionTotal(proof) {
  return (proof.reactions ?? []).reduce((sum, r) => sum + (r.count ?? 0), 0);
}

/* ── 사진 위 상태 배지 (피그마 오버레이 스타일) ─────────── */
function OverlayStatusBadge({ status }) {
  const C = W;
  const verified = status === 'VERIFIED';
  return (
    <View style={{
      backgroundColor: C.borderStrong, borderWidth: 1, borderColor: C.brown,
      borderRadius: 5, paddingHorizontal: 6, paddingVertical: 4,
    }}>
      <WarmText v="caption" size={11} color={C.text}>{verified ? 'V 인증완료' : '대기 중'}</WarmText>
    </View>
  );
}

/* ── 인증해주기 칩 (Featured 카드 푸터) ─────────────────── */
function VerifyChip({ proof, onPress }) {
  const C = W;
  const confirmed = proof.myConfirmed;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={confirmed}
      onPress={() => { H.success(); onPress?.(); }}
      style={[{
        backgroundColor: C.borderStrong, borderWidth: 1, borderColor: C.brown,
        borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
      }, confirmed && { backgroundColor: C.greenFaint, borderColor: C.greenBorder }]}
    >
      <WarmText v="caption" size={11} color={confirmed ? C.green : C.text}>
        {confirmed ? '✓ 인증함' : `인증해주기 ${proof.confirmCount ?? 0}/${proof.requiredConfirm ?? 0}`}
      </WarmText>
    </TouchableOpacity>
  );
}

/* ── Featured 카드 (가장 많은 리액션 / 솔로 인증) ───────── */
function FeaturedCard({ proof, solo, onReact, onPeerVerify, onOpen }) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);
  const photo = resolvePhoto(proof.photoUrl);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onOpen} style={s.featuredCard}>
      <View>
        {photo ? (
          <Image source={{ uri: photo }} style={s.featuredPhoto} resizeMode="cover" />
        ) : (
          <View style={[s.featuredPhoto, s.photoEmpty]}><WarmText size={44}>📷</WarmText></View>
        )}
        <View style={s.featuredOverlay}>
          <MemberAvatar avatarId={proof.authorAvatarId} size={32} />
          <View style={{ flex: 1, gap: 3 }}>
            <WarmText v="body" size={14} color={C.white} numberOfLines={1}>{proof.authorNickname}</WarmText>
            <WarmText v="caption" size={13} color="rgba(255,255,255,0.6)" numberOfLines={1}>
              🕐 {timeLabel(proof.createdAt)} 미션 완료
            </WarmText>
          </View>
          <OverlayStatusBadge status={proof.status} />
        </View>
      </View>

      {proof.caption ? (
        <WarmText v="body" size={14} style={{ paddingHorizontal: 14, paddingTop: 10 }}>{proof.caption}</WarmText>
      ) : null}

      {solo ? (
        <View style={s.soloFooter}>
          <ReactionBar reactions={proof.reactions} onToggle={(emoji) => onReact?.(proof.id, emoji)} />
          <WarmText v="caption" size={13} color={C.brown}>오늘도 미션 완료 🎉</WarmText>
        </View>
      ) : (
        <View style={s.featuredFooter}>
          <View style={{ flex: 1 }}>
            <ReactionBar reactions={proof.reactions} onToggle={(emoji) => onReact?.(proof.id, emoji)} />
          </View>
          <VerifyChip proof={proof} onPress={() => onPeerVerify?.(proof.id)} />
        </View>
      )}
    </TouchableOpacity>
  );
}

/* ── 그리드 인증 카드 (모든 인증 2열) ───────────────────── */
function GridProofCard({ proof, onReact, onPeerVerify, onOpen }) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);
  const photo = resolvePhoto(proof.photoUrl);
  const confirmed = proof.myConfirmed;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onOpen} style={s.gridCard}>
      <View>
        {photo ? (
          <Image source={{ uri: photo }} style={s.gridPhoto} resizeMode="cover" />
        ) : (
          <View style={[s.gridPhoto, s.photoEmpty]}><WarmText size={32}>📷</WarmText></View>
        )}
        <View style={s.gridTopOverlay}>
          <MemberAvatar avatarId={proof.authorAvatarId} size={16} />
          <WarmText v="caption" size={11} color={C.white} numberOfLines={1} style={{ flex: 1 }}>
            {proof.authorNickname}
          </WarmText>
        </View>
        <View style={s.gridBottomOverlay}>
          <WarmText v="caption" size={11} color={C.bg}>{timeLabel(proof.createdAt)}</WarmText>
          <WarmText v="caption" size={11} color={C.bg} numberOfLines={1} style={{ flex: 1 }}>미션 완료</WarmText>
          <WarmText v="caption" size={11} color={C.bg}>{proof.status === 'VERIFIED' ? 'V' : '대기'}</WarmText>
        </View>
      </View>

      <View style={s.gridReactions}>
        <ReactionBar reactions={proof.reactions} onToggle={(emoji) => onReact?.(proof.id, emoji)} />
      </View>

      <View style={s.gridVerifyWrap}>
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={confirmed}
          onPress={() => { H.success(); onPeerVerify?.(proof.id); }}
          style={[s.gridVerifyBtn, confirmed && { backgroundColor: C.greenFaint, borderColor: C.greenBorder }]}
        >
          <WarmText v="caption" size={12} color={confirmed ? C.green : C.text}>
            {confirmed ? '✓ 인증함' : '인증해주기'}
          </WarmText>
        </TouchableOpacity>
      </View>
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
  onOpenProof, onOpenHistory, onOpenLeaderboard, onComplete, onChanged, version,
}) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [nudgedIds, setNudgedIds] = useState(() => new Set());

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

  useEffect(() => {
    setNudgedIds(new Set());
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load, version]);

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

  const handleNudge = useCallback(async (memberId) => {
    H.success();
    setNudgedIds(prev => new Set(prev).add(memberId)); // 낙관적 표시
    try {
      await api.post(`/api/v1/rooms/${roomId}/members/${memberId}/nudge`);
    } catch (e) {
      console.warn('콕 찌르기 실패:', e);
      setNudgedIds(prev => { const next = new Set(prev); next.delete(memberId); return next; });
    }
  }, [roomId]);

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
  const progressPct = solo
    ? (status === 'DONE' ? 100 : 0)
    : (prog.requiredCount > 0 ? Math.min(100, (prog.verifiedCount / prog.requiredCount) * 100) : 0);

  const pendingMembers = (room.members ?? []).filter(m => m.todayStatus !== 'DONE');
  const proofs = room.proofs ?? [];
  const filtered = filter === 'all' ? proofs : proofs.filter(p => p.status === filter);

  // Featured — 리액션 합이 가장 큰 인증 (그룹, 리액션 1개 이상일 때만)
  let featured = null;
  if (!solo && filtered.length > 0) {
    const top = filtered.reduce((a, b) => (reactionTotal(b) > reactionTotal(a) ? b : a), filtered[0]);
    if (reactionTotal(top) > 0) featured = top;
  }
  const gridProofs = featured ? filtered.filter(p => p.id !== featured.id) : filtered;

  const openProof = (p) => { H.tap(); onOpenProof?.({ proofId: p.id, missionTitle: mission?.title, isGroup: !solo }); };

  return (
    <View style={s.screen}>
      <RoomTopBar
        title={`${roomIconEmoji(room.iconKey)} ${room.name}`}
        subtitle={solo ? '혼자 하는 방' : `멤버 ${room.memberCount}명`}
        onBack={onBack}
        rightIcon="settings-outline"
        onRight={() => { H.tap(); onOpenSettings?.(); }}
      />

      <ScrollView contentContainerStyle={[s.content, !mission && s.contentCentered]} showsVerticalScrollIndicator={false}>
        {mission ? (
          <>
            {/* 미션 바 */}
            <View style={s.missionBar}>
              <View style={s.missionRow}>
                <WarmText size={18}>{mission.icon}</WarmText>
                <WarmText v="body" size={17} numberOfLines={1} style={{ flex: 1 }}>{mission.title}</WarmText>
                <SourceBadge source={mission.source} />
                {!solo ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    hitSlop={8}
                    onPress={() => { H.tap(); onOpenLeaderboard?.({ roomName: room.name, roomIcon: roomIconEmoji(room.iconKey) }); }}
                  >
                    <Ionicons name="trophy-outline" size={18} color={C.textSub} />
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${progressPct}%` }]} />
              </View>
              {solo ? (
                <WarmText v="caption" size={13} color={C.green}>
                  {status === 'DONE' ? '오늘 미션 인증 완료' : '아직 인증 전이에요'}
                </WarmText>
              ) : (
                <View style={s.countRow}>
                  <WarmText v="section" size={16} color={C.green}>{prog.verifiedCount}명</WarmText>
                  <WarmText v="section" size={16} color={C.textSub}> / {prog.requiredCount}명 인증 완료</WarmText>
                </View>
              )}
            </View>

            {/* 인증하기 버튼 / 상태 배너 */}
            {status === 'DONE' || status === 'PENDING' ? (
              <View style={s.doneBanner}>
                <WarmText v="section" size={15} color={C.green}>
                  {status === 'DONE' ? '✓  인증 완료!' : '인증 대기 중…'}
                </WarmText>
              </View>
            ) : (
              <TouchableOpacity activeOpacity={0.85} onPress={() => { H.tap(); onOpenVerify?.(room); }} style={s.verifyBtn}>
                <Ionicons name="camera-outline" size={20} color="#fff9f3" />
                <WarmText v="btn">인증하기</WarmText>
              </TouchableOpacity>
            )}

            {/* 수행 중 멤버 (그룹) */}
            {!solo && pendingMembers.length > 0 ? (
              <View style={s.pendingStrip}>
                <View style={s.sectionHead}>
                  <WarmText v="section" size={15}>수행 중</WarmText>
                  <WarmText v="caption" size={11} color={C.text}>{pendingMembers.length}명 미인증</WarmText>
                </View>
                <View style={{ gap: 12 }}>
                  {pendingMembers.map(m => {
                    // 아직 미션을 시작하지 않은(NONE) 다른 멤버만 콕 찌를 수 있다
                    const canNudge = !m.isMe && m.todayStatus !== 'PENDING';
                    const nudged = m.nudgedByMe || nudgedIds.has(m.memberId);
                    return (
                      <View key={m.memberId} style={s.pendingRow}>
                        <MemberAvatar avatarId={m.avatarId} size={30} />
                        <WarmText v="body" size={14} style={{ flex: 1 }}>{m.nickname}</WarmText>
                        {canNudge ? (
                          <NudgeChip nudged={nudged} onPress={() => handleNudge(m.memberId)} />
                        ) : (
                          <WarmText v="caption" size={11} color={m.todayStatus === 'PENDING' ? C.green : C.textSub}>
                            {m.todayStatus === 'PENDING' ? '인증 대기' : '미인증'}
                          </WarmText>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* 인증 피드 */}
            {!solo ? (
              <View style={s.feed}>
                {/* 필터 칩 */}
                <View style={s.filterRow}>
                  {FILTERS.map(f => {
                    const active = filter === f.key;
                    return (
                      <TouchableOpacity
                        key={f.key}
                        activeOpacity={0.8}
                        onPress={() => { H.tap(); setFilter(f.key); }}
                        style={[s.filterChip, active && { borderColor: C.brown, backgroundColor: C.borderStrong }]}
                      >
                        <WarmText v="body" size={14} color={active ? C.surface : C.text}>{f.label}</WarmText>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 가장 많은 리액션 */}
                {featured ? (
                  <>
                    <WarmText v="section" size={15}>✦  가장 많은 리액션</WarmText>
                    <FeaturedCard
                      proof={featured}
                      onReact={handleReact}
                      onPeerVerify={handlePeerVerify}
                      onOpen={() => openProof(featured)}
                    />
                  </>
                ) : null}

                {/* 모든 인증 */}
                <View style={s.sectionHead}>
                  <WarmText v="section" size={15}>모든 인증</WarmText>
                  <TouchableOpacity onPress={() => { H.tap(); onOpenHistory?.(); }} activeOpacity={0.7}>
                    <WarmText v="caption" size={13} color={C.brown}>지난기록 보기</WarmText>
                  </TouchableOpacity>
                </View>

                {filtered.length === 0 ? (
                  <View style={s.feedEmpty}>
                    <WarmText size={26} style={{ marginBottom: 6 }}>🫶</WarmText>
                    <WarmText v="sub" style={{ textAlign: 'center' }}>아직 인증이 없어요{'\n'}첫 인증의 주인공이 되어보세요</WarmText>
                  </View>
                ) : gridProofs.length > 0 ? (
                  <View style={s.grid}>
                    {gridProofs.map(p => (
                      <GridProofCard
                        key={p.id}
                        proof={p}
                        onReact={handleReact}
                        onPeerVerify={handlePeerVerify}
                        onOpen={() => openProof(p)}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={s.feed}>
                <WarmText v="section" size={15}>오늘의 인증</WarmText>
                {proofs.length === 0 ? (
                  <View style={s.feedEmpty}>
                    <WarmText size={26} style={{ marginBottom: 6 }}>🫶</WarmText>
                    <WarmText v="sub" style={{ textAlign: 'center' }}>아직 인증이 없어요{'\n'}첫 인증의 주인공이 되어보세요</WarmText>
                  </View>
                ) : (
                  proofs.map(p => (
                    <FeaturedCard
                      key={p.id}
                      proof={p}
                      solo
                      onReact={handleReact}
                      onOpen={() => openProof(p)}
                    />
                  ))
                )}
              </View>
            )}
          </>
        ) : (
          /* 미션 미정 (Empty) — 화면 세로 중앙 */
          <View style={s.emptyMission}>
            <View style={s.emptyIcon}><WarmText size={38}>🎲</WarmText></View>
            <WarmText v="title" size={17} style={{ marginTop: 14 }}>오늘의 미션이 아직 없어요</WarmText>
            <WarmText v="sub" color={C.brown} style={{ textAlign: 'center', marginTop: 6, marginBottom: 20 }}>
              {solo ? '오늘의 미션을 정해보세요' : '미션을 정하면 멤버 모두에게 알림이 가요'}
            </WarmText>
            <GreenButton label="랜덤 미션 뽑기" ionicon="dice-outline" onPress={handleRandom} style={{ width: '100%', marginBottom: 10 }} />
            <OutlineButton label="직접 정하기" ionicon="create-outline" onPress={() => { H.tap(); onOpenMissionPicker?.(); }} style={{ width: '100%' }} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: C.bg },
    center:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    content: { paddingBottom: 40 },
    contentCentered: { flexGrow: 1, justifyContent: 'center', paddingBottom: 80 },

    // 미션 바 (피그마 MissionBar: bg back / border #a8958a / r14 / px14 py20)
    missionBar: { marginHorizontal: 20, marginTop: 4, backgroundColor: C.bg, borderRadius: 14, borderWidth: 1, borderColor: C.borderStrong, paddingHorizontal: 14, paddingVertical: 20, gap: 10 },
    missionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    // 미션바 진행률 — 피그마: 트랙 rgba(168,149,138,0.4) / 채움 브라운
    progressTrack: { height: 7, borderRadius: 3.5, backgroundColor: C.neutralStrong, overflow: 'hidden' },
    progressFill:  { height: '100%', borderRadius: 3.5, backgroundColor: C.brown },
    countRow: { flexDirection: 'row', alignItems: 'baseline' },

    verifyBtn:  { marginHorizontal: 20, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.green, borderRadius: 14, paddingVertical: 15 },
    doneBanner: { marginHorizontal: 20, marginTop: 16, borderWidth: 1, borderColor: C.greenBorder, backgroundColor: C.greenFaint, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },

    // 수행 중 (피그마 PendingStrip: greenFaint / greenBorder / r20 / p16)
    pendingStrip: { marginHorizontal: 20, marginTop: 16, backgroundColor: C.greenFaint, borderWidth: 1, borderColor: C.greenBorder, borderRadius: 20, padding: 16 },
    sectionHead:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    pendingRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },

    // 인증 피드
    feed:       { marginHorizontal: 20, marginTop: 16, gap: 16 },
    filterRow:  { flexDirection: 'row', gap: 8 },
    filterChip: { borderWidth: 1, borderColor: C.borderStrong, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.bg },
    feedEmpty:  { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: C.borderStrong, paddingVertical: 26, alignItems: 'center' },

    // Featured 카드 (사진 220 + 오버레이 유저행)
    featuredCard:    { backgroundColor: C.neutral, borderRadius: 18, borderWidth: 1, borderColor: C.borderStrong, overflow: 'hidden' },
    featuredPhoto:   { width: '100%', height: 220, backgroundColor: C.surface2 },
    featuredOverlay: { position: 'absolute', top: 12, left: 12, right: 12, height: 48, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
    featuredFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
    soloFooter:      { paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
    photoEmpty:      { alignItems: 'center', justifyContent: 'center' },

    // 그리드 카드 (2열, 사진 150 + 오버레이)
    grid:              { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    gridCard:          { flexGrow: 1, flexBasis: '45%', maxWidth: '48.5%', backgroundColor: C.neutral, borderRadius: 14, borderWidth: 1, borderColor: C.borderStrong, overflow: 'hidden' },
    gridPhoto:         { width: '100%', height: 150, backgroundColor: C.surface2 },
    gridTopOverlay:    { position: 'absolute', top: 7, left: 7, right: 7, height: 26, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 8, paddingHorizontal: 7 },
    gridBottomOverlay: { position: 'absolute', bottom: 7, left: 7, right: 7, height: 22, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 6, paddingHorizontal: 8 },
    gridReactions:     { paddingHorizontal: 8, paddingTop: 10, paddingBottom: 8 },
    gridVerifyWrap:    { paddingHorizontal: 8, paddingBottom: 8 },
    gridVerifyBtn:     { alignItems: 'center', justifyContent: 'center', paddingVertical: 7, borderRadius: 10, backgroundColor: C.borderStrong, borderWidth: 1, borderColor: C.brown },

    // 미션 미정 Empty (피그마: r22 / 1.5px rgba(168,149,138,0.4) / pt32 pb24 px24)
    emptyMission: { marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 22, borderWidth: 1.5, borderColor: C.neutralStrong, paddingTop: 32, paddingBottom: 24, paddingHorizontal: 24, alignItems: 'center' },
    emptyIcon:    { width: 88, height: 88, borderRadius: 44, backgroundColor: C.greenFaint, alignItems: 'center', justifyContent: 'center' },
  });
}
