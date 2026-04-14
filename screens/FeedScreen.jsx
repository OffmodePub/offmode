import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, ActivityIndicator, Image,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../utils/useColors';
import { api, BASE_URL } from '../utils/api';
import T from '../components/ThemedText';

const F = 'Kkukkukk';
const { width } = Dimensions.get('window');
const CARD_W = (width - 40 - 8) / 2;

const GRAD_PALETTE = [
  ['#87ceeb','#2a7ab8'], ['#acd8a7','#2e7d4f'], ['#c3aef0','#5a2da0'],
  ['#ffd180','#e65100'], ['#90caf9','#1a3a6a'], ['#a5d6a7','#1b5e20'],
];

function apiItemToCard(item, idx) {
  const d = new Date(item.createdAt);
  const pad = n => String(n).padStart(2, '0');
  // 고정 3개는 항상 표시, 커스텀 이모지는 그 뒤에 추가
  const backendReactions = item.reactions ?? [];
  const reactionMap = {};
  backendReactions.forEach(r => { reactionMap[r.emoji] = r; });
  const reactions = [
    ...FIXED_EMOJIS.map(e => reactionMap[e] ?? { emoji: e, count: 0, myReact: false }),
    ...backendReactions.filter(r => !FIXED_EMOJIS.includes(r.emoji)),
  ];
  return {
    id:           item.id,
    user:         item.userName    ?? '오프모더',
    avatar:       item.userAvatar  ?? '🏃',
    hip:          (item.userLevel  ?? 1) >= 3,
    verified:     item.verifyCount > 0,
    verifyCount:  item.verifyCount ?? 0,
    myVerify:     item.myVerify    ?? false,
    isOwn:        item.isOwn       ?? false,
    time:         `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    label:        '미션 완료',
    status:       (item.verifyCount ?? 0) > 0 ? 'done' : 'pending',
    grad:         GRAD_PALETTE[idx % GRAD_PALETTE.length],
    reactions,
    caption:      item.caption  ?? null,
    photoUrl:     item.photoUrl ? `${BASE_URL}${item.photoUrl}` : null,
    missionIcon:  item.missionIcon,
    missionText:  item.missionText,
  };
}

const FILTERS = ['전체', '인증 완료', '인증 대기'];
const VERIFY_THRESHOLD = 1;
const FIXED_EMOJIS = ['🔥', '👍', '💜'];

// 이모지 피커 — TextInput autoFocus로 키보드 즉시 오픈, onBlur 없음
function EmojiPicker({ onSelect, onClose }) {
  const C = useColors();
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={ep.backdrop} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={ep.kvWrap}
        pointerEvents="box-none"
      >
        <View style={[ep.sheet, { backgroundColor: C.surface, borderTopColor: C.border }]}>
          <View style={ep.header}>
            <T v="section">이모지 추가</T>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <T v="sub" style={{ opacity: 0.5 }}>닫기</T>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[ep.input, { color: C.text, borderColor: C.greenBorder, backgroundColor: C.greenFaint }]}
            onChangeText={(text) => { const chars = [...text]; if (chars.length > 0) onSelect(chars[0]); }}
            maxLength={8}
            placeholder="😊"
            placeholderTextColor={C.textSub}
            autoFocus
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const ep = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  kvWrap:   { flex: 1, justifyContent: 'flex-end' },
  sheet:    { borderTopWidth: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20, alignItems: 'center', gap: 12 },
  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  input:    { fontSize: 34, textAlign: 'center', width: 80, height: 64, borderWidth: 1.5, borderRadius: 16 },
});

const ph = StyleSheet.create({
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarBig:  { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 26 },
});

function PhotoPlaceholder({ grad, avatar, photoUrl }) {
  if (photoUrl) {
    return (
      <View style={{ flex: 1 }}>
        <Image source={{ uri: photoUrl }} style={{ flex: 1 }} resizeMode="cover" />
      </View>
    );
  }
  return (
    <LinearGradient colors={grad} style={{ flex: 1 }}>
      <View style={ph.center}>
        <View style={ph.avatarBig}><Text style={ph.avatarEmoji}>{avatar}</Text></View>
      </View>
    </LinearGradient>
  );
}

function FeaturedCard({ item, onReact, onVerify }) {
  const C = useColors();
  const feat = useMemo(() => makeFeatStyles(C), [C]);
  const [showPicker, setShowPicker] = useState(false);
  return (
    <View style={feat.card}>
      <View style={feat.photo}>
        <PhotoPlaceholder grad={item.grad} avatar={item.avatar} photoUrl={item.photoUrl} />
        <View style={feat.userRow}>
          <View style={feat.avatar}><Text style={feat.avatarEmoji}>{item.avatar}</Text></View>
          <View style={{ flex: 1 }}>
            <T v="sub" color="#fff">{item.user}</T>
            <T v="caption" color="rgba(255,255,255,0.6)" style={{ marginTop: 1 }}>🕐 {item.time} {item.label}</T>
          </View>
          {item.hip && <View style={feat.hipBadge}><T v="caption" color="#000">HIP</T></View>}
          {item.verified
            ? <View style={feat.statusBadgeGreen}><T v="caption" size={9} color="#000">✓ 인증완료</T></View>
            : <View style={feat.statusBadgePending}><T v="caption" size={9} color="rgba(255,255,255,0.8)">인증 대기</T></View>
          }
        </View>
        {item.caption && <View style={feat.captionWrap}><T v="sub" color="#fff">{item.caption}</T></View>}
      </View>
      <View style={feat.footer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={feat.reactions}>
          {item.reactions.map(r => (
            <TouchableOpacity key={r.emoji} style={[feat.reactionBtn, r.myReact && feat.reactionBtnActive]} onPress={() => onReact(item.id, r.emoji)} activeOpacity={0.7}>
              <Text style={feat.reactionEmoji}>{r.emoji}</Text>
              <T v="label" style={r.myReact ? { color: C.green } : undefined}>{r.count}</T>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={feat.addBtn} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
            <T v="label" color={C.textSub}>+</T>
          </TouchableOpacity>
        </ScrollView>
        {!item.isOwn && (
          <TouchableOpacity
            style={[feat.verifyBtn, item.myVerify && feat.verifyBtnDone]}
            onPress={() => onVerify(item.id)}
            disabled={item.myVerify}
            activeOpacity={0.7}
          >
            <T v="caption" color={item.myVerify ? C.green : C.textSub}>
              {item.myVerify ? '✓ 인증함' : '인증해주기'}{item.verifyCount > 0 ? ` ${item.verifyCount}` : ''}
            </T>
          </TouchableOpacity>
        )}
        {item.isOwn && item.verifyCount > 0 && (
          <T v="caption" color={C.green} style={{ opacity: 0.8 }}>✓ {item.verifyCount}명 인증</T>
        )}
      </View>
      {showPicker && (
        <EmojiPicker
          onSelect={(emoji) => { onReact(item.id, emoji); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </View>
  );
}

function makeFeatStyles(C) {
  return StyleSheet.create({
    card: { marginHorizontal: 16, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.greenBorder, backgroundColor: C.surface2, marginBottom: 15 },
    photo: { height: 220, position: 'relative' },
    userRow: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    avatarEmoji: { fontSize: 18 },
    username: { fontFamily: F, fontSize: 13, color: '#fff' },
    time:     { fontFamily: F, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
    hipBadge: { marginLeft: 'auto', backgroundColor: C.green, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    hipText:  { fontFamily: F, fontSize: 11, color: '#000' },
    captionWrap: { position: 'absolute', bottom: 12, left: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
    caption:  { fontFamily: F, fontSize: 13, color: '#fff' },
    footer:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
    reactions: { flexDirection: 'row', gap: 6 },
    reactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
    reactionBtnActive: { backgroundColor: C.greenFaint, borderColor: C.greenBorder },
    reactionEmoji: { fontSize: 15 },
    reactionCount: { fontFamily: F, fontSize: 12, color: C.textSub },
    reactionCountActive: { color: C.green },
    totalCount: { fontFamily: F, fontSize: 11, color: C.textSub, opacity: 0.6 },
    verifyBtn:        { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
    verifyBtnDone:    { backgroundColor: C.greenFaint, borderColor: C.greenBorder },
    statusBadgeGreen: { backgroundColor: 'rgba(34,201,122,0.85)', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
    statusBadgePending: { backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
    addBtn:           { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface },
  });
}

function GridCard({ item, onReact, onVerify }) {
  const C = useColors();
  const grid = useMemo(() => makeGridStyles(C), [C]);
  const [showPicker, setShowPicker] = useState(false);
  return (
    <View style={grid.card}>
      <View style={grid.photo}>
        <PhotoPlaceholder grad={item.grad} avatar={item.avatar} photoUrl={item.photoUrl} />
        <View style={grid.topRow}>
          <Text style={grid.avatar}>{item.avatar}</Text>
          <T v="caption" color="#fff" style={{ flex: 1 }} numberOfLines={1}>{item.user}</T>
          {item.hip && <View style={grid.hipBadge}><T v="caption" size={9} color="#000">HIP</T></View>}
        </View>
        <View style={grid.tsWrap}>
          <T v="caption" color={C.green}>{item.time}</T>
          <T v="caption" color="#fff" style={{ flex: 1 }}> {item.label}</T>
          {item.verified
            ? <T v="caption" color={C.green}>✓</T>
            : <T v="caption" color="rgba(255,255,255,0.5)">대기</T>
          }
        </View>
      </View>
      {item.caption && <T v="caption" style={{ paddingHorizontal: 10, paddingTop: 7 }} numberOfLines={1}>{item.caption}</T>}
      <View style={grid.reactions}>
        {item.reactions.map(r => (
          <TouchableOpacity key={r.emoji} style={[grid.reactionBtn, r.myReact && grid.reactionBtnActive]} onPress={() => onReact(item.id, r.emoji)} activeOpacity={0.7}>
            <Text style={grid.reactionEmoji}>{r.emoji}</Text>
            <T v="caption" style={r.myReact ? { color: C.green } : undefined}>{r.count}</T>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={grid.addBtn} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
          <T v="caption" color={C.textSub}>+</T>
        </TouchableOpacity>
      </View>
      {!item.isOwn && (
        <TouchableOpacity
          style={[grid.verifyBtn, item.myVerify && grid.verifyBtnDone]}
          onPress={() => onVerify(item.id)}
          disabled={item.myVerify}
          activeOpacity={0.7}
        >
          <T v="caption" size={12} color={item.myVerify ? C.green : C.textSub}>
            {item.myVerify ? '✓ 인증함' : '인증해주기'}{item.verifyCount > 0 ? `  ${item.verifyCount}명` : ''}
          </T>
        </TouchableOpacity>
      )}
      {item.isOwn && item.verifyCount > 0 && (
        <T v="caption" color={C.green} style={{ paddingHorizontal: 10, paddingBottom: 8 }}>✓ {item.verifyCount}명이 인증해줬어요</T>
      )}
      {showPicker && (
        <EmojiPicker
          onSelect={(emoji) => { onReact(item.id, emoji); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </View>
  );
}

function makeGridStyles(C) {
  return StyleSheet.create({
    card: { width: CARD_W, borderRadius: 14, overflow: 'hidden', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
    photo: { height: 150, position: 'relative' },
    topRow: { position: 'absolute', top: 7, left: 7, right: 7, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 5 },
    avatar:   { fontSize: 13 },
    username: { fontFamily: F, flex: 1, fontSize: 11, color: '#fff' },
    hipBadge: { backgroundColor: C.green, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
    hipText:  { fontFamily: F, fontSize: 9, color: '#000' },
    tsWrap:   { position: 'absolute', bottom: 7, left: 7, right: 7, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
    tsTime:   { fontFamily: F, fontSize: 11, color: C.green },
    tsLabel:  { fontFamily: F, fontSize: 11, color: '#fff' },
    caption:  { fontFamily: F, fontSize: 11, color: C.textSub, paddingHorizontal: 10, paddingTop: 7 },
    reactions: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: 8 },
    reactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingHorizontal: 7, paddingVertical: 3 },
    reactionBtnActive: { backgroundColor: C.greenFaint, borderColor: C.greenBorder },
    reactionEmoji: { fontSize: 13 },
    reactionCount: { fontFamily: F, fontSize: 11, color: C.textSub },
    verifyBtn:     { marginHorizontal: 8, marginBottom: 8, paddingVertical: 7, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface2 },
    verifyBtnDone: { backgroundColor: C.greenFaint, borderColor: C.greenBorder },
    addBtn:        { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  });
}

export default function FeedScreen() {
  const C = useColors();
  const s = useMemo(() => makeSStyles(C), [C]);
  const [items, setItems]   = useState([]);
  const [filter, setFilter] = useState('전체');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/feed')
      .then(data => setItems(data.map(apiItemToCard)))
      .catch(e => console.warn('피드 로딩 실패:', e))
      .finally(() => setLoading(false));
  }, []);

  const handleReact = (id, emoji) => {
    const toggle = (reactions, emoji, direction) => {
      const existing = reactions.find(r => r.emoji === emoji);
      if (existing) {
        const newCount = existing.count + direction;
        // 고정 이모지는 count가 0이어도 유지, 커스텀은 0이 되면 제거
        if (newCount <= 0 && !FIXED_EMOJIS.includes(emoji))
          return reactions.filter(r => r.emoji !== emoji);
        return reactions.map(r => r.emoji === emoji
          ? { ...r, count: Math.max(0, newCount), myReact: direction > 0 }
          : r);
      }
      return direction > 0 ? [...reactions, { emoji, count: 1, myReact: true }] : reactions;
    };

    // 낙관적 업데이트
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const already = item.reactions.find(r => r.emoji === emoji)?.myReact ?? false;
      return { ...item, reactions: toggle(item.reactions, emoji, already ? -1 : 1) };
    }));

    api.post(`/api/feed/${id}/react`, { emoji }).catch(e => {
      console.warn('리액션 실패:', e);
      // 롤백
      setItems(prev => prev.map(item => {
        if (item.id !== id) return item;
        const wasActive = item.reactions.find(r => r.emoji === emoji)?.myReact ?? false;
        return { ...item, reactions: toggle(item.reactions, emoji, wasActive ? -1 : 1) };
      }));
    });
  };

  const handleVerify = async (id) => {
    // 낙관적 업데이트
    setItems(prev => prev.map(item => {
      if (item.id !== id || item.myVerify || item.isOwn) return item;
      const newCount = item.verifyCount + 1;
      return { ...item, myVerify: true, verifyCount: newCount, verified: newCount >= VERIFY_THRESHOLD };
    }));
    try {
      await api.post(`/api/feed/${id}/confirm`);
    } catch (e) {
      console.warn('인증 실패:', e);
      // 롤백
      setItems(prev => prev.map(item => {
        if (item.id !== id) return item;
        const newCount = Math.max(0, item.verifyCount - 1);
        return { ...item, myVerify: false, verifyCount: newCount, verified: newCount >= VERIFY_THRESHOLD };
      }));
    }
  };

  const filtered   = items.filter(item =>
    filter === '인증 완료' ? item.verifyCount >= VERIFY_THRESHOLD :
    filter === '인증 대기' ? item.verifyCount < VERIFY_THRESHOLD : true
  );
  const featured   = filtered[0];
  const rest       = filtered.slice(1);
  const doneCount  = items.filter(i => i.verified).length;
  const totalCount = items.length;

  if (loading) {
    return (
      <View style={[s.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={C.green} />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <T v="title" size={18}>동일 미션 인증 피드</T>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.missionBar}>
          <View style={s.missionNameRow}>
            <Text style={s.missionIcon}>{featured?.missionIcon ?? '📋'}</Text>
            <T v="section" style={{ flex: 1 }} numberOfLines={1}>{featured?.missionText ?? '오늘의 미션'}</T>
          </View>
          <View style={s.participantRow}>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${(doneCount / totalCount) * 100}%` }]} />
            </View>
            <T v="sub">
              <T v="sub" color={C.green}>{doneCount}명</T>{' '}/ {totalCount}명 인증 완료
            </T>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[s.filterChip, filter === f && s.filterChipActive]} onPress={() => setFilter(f)} activeOpacity={0.7}>
              <T v="body" style={filter === f ? { color: C.green } : undefined}>{f}</T>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {featured && (
          <>
            <T v="sub" style={{ paddingHorizontal: 16, marginBottom: 15 }}>✦  가장 많은 리액션</T>
            <FeaturedCard item={featured} onReact={handleReact} onVerify={handleVerify} />
          </>
        )}
        {rest.length > 0 && (
          <>
            <T v="sub" style={{ paddingHorizontal: 16, marginBottom: 15 }}>모든 인증</T>
            <View style={s.gridWrap}>
              {rest.map(item => <GridCard key={item.id} item={item} onReact={handleReact} onVerify={handleVerify} />)}
            </View>
          </>
        )}
        {filtered.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🔍</Text>
            <T v="sub" size={15}>아직 인증이 없어요</T>
          </View>
        )}
        <View style={s.footer}>
          <T v="green" style={{ fontStyle: 'italic', opacity: 0.4 }}>OFFMODE</T>
        </View>
      </ScrollView>
    </View>
  );
}

function makeSStyles(C) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.bg, paddingBottom: 100 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 24, paddingHorizontal: 20 },
    headerTitle: { fontFamily: F, fontSize: 17, color: C.text },
    missionBar: { marginHorizontal: 16, marginBottom: 20, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
    missionNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    missionIcon: { fontSize: 18 },
    missionName: { fontFamily: F, fontSize: 14, color: C.text, flex: 1 },
    participantRow: { gap: 6 },
    progressTrack: { height: 7, backgroundColor: C.surface2, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
    progressFill:  { height: '100%', borderRadius: 3, backgroundColor: C.green },
    participantText: { fontFamily: F, fontSize: 12, color: C.textSub },
    filterRow:     { marginBottom: 20 },
    filterChip:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
    filterChipActive: { backgroundColor: C.greenFaint, borderColor: C.greenBorder },
    filterText:    { fontFamily: F, fontSize: 13, color: C.textSub },
    filterTextActive: { color: C.green },
    sectionLabel:  { fontFamily: F, fontSize: 13, color: C.textSub, paddingHorizontal: 16, marginBottom: 10 },
    gridWrap:      { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
    empty:         { alignItems: 'center', paddingVertical: 60, gap: 12 },
    emptyEmoji:    { fontSize: 40 },
    emptyText:     { fontFamily: F, fontSize: 15, color: C.textSub },
    footer:        { alignItems: 'center', paddingVertical: 20 },
    footerLogo:    { fontFamily: F, fontSize: 14, fontStyle: 'italic', color: C.green, opacity: 0.4 },
  });
}
