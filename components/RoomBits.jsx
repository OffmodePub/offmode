import React, { useMemo, useState } from 'react';
import {
  View, Image, StyleSheet, TouchableOpacity, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { W } from '../constants/warm';
import WarmText from './WarmText';
import * as H from '../utils/haptics';
import { roomIconEmoji, DEFAULT_REACTIONS, EMOJI_PALETTE } from '../constants/rooms';
import { getAvatarDefaultSource } from '../utils/avatars';

/* ── 상단 헤더 (뒤로/제목/우측액션) ─────────────────────── */
export function RoomTopBar({ title, subtitle, onBack, rightIcon, onRight, titleSize = 18, subtitleColor }) {
  const C = W;
  const s = useMemo(() => makeBarStyles(C), [C]);
  return (
    <View style={s.bar}>
      <TouchableOpacity onPress={onBack} hitSlop={12} style={s.side} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={20} color={C.text} />
      </TouchableOpacity>
      <View style={s.center}>
        <WarmText v="title" size={titleSize} numberOfLines={1}>{title}</WarmText>
        {subtitle ? <WarmText v="caption" color={subtitleColor ?? C.green} style={{ marginTop: 2 }}>{subtitle}</WarmText> : null}
      </View>
      {rightIcon ? (
        <TouchableOpacity onPress={onRight} hitSlop={12} style={s.side} activeOpacity={0.7}>
          <Ionicons name={rightIcon} size={20} color={C.textSub} />
        </TouchableOpacity>
      ) : (
        <View style={s.side} />
      )}
    </View>
  );
}

function makeBarStyles(C) {
  return StyleSheet.create({
    bar:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
    side:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    center: { flex: 1, alignItems: 'center' },
  });
}

/* ── 멤버 아바타 (얼굴 이미지) ──────────────────────────── */
export function MemberAvatar({ avatarId, size = 32, borderColor }) {
  const C = W;
  const src = getAvatarDefaultSource(avatarId);
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2, overflow: 'hidden',
      borderWidth: 1, borderColor: borderColor ?? C.borderStrong, backgroundColor: C.surface2,
      alignItems: 'center', justifyContent: 'center',
    }}>
      {src ? <Image source={src} style={{ width: size, height: size }} resizeMode="contain" /> : null}
    </View>
  );
}

export function AvatarStack({ members = [], size = 28, max = 4 }) {
  const C = W;
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {shown.map((m, i) => (
        <View key={m.memberId ?? m.userId ?? i} style={{ marginLeft: i === 0 ? 0 : -10 }}>
          <MemberAvatar avatarId={m.avatarId} size={size} />
        </View>
      ))}
      {extra > 0 && (
        <View style={{
          width: size, height: size, borderRadius: size / 2, marginLeft: -10,
          backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <WarmText v="caption" size={10}>+{extra}</WarmText>
        </View>
      )}
    </View>
  );
}

/* ── 방 아이콘 박스 ─────────────────────────────────────── */
export function RoomIcon({ iconKey, size = 44, accent = false }) {
  const C = W;
  return (
    <View style={{
      width: size, height: size, borderRadius: size * 0.32,
      backgroundColor: accent ? C.greenFaint : C.surface2,
      borderWidth: 1, borderColor: accent ? C.greenBorder : C.border,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <WarmText size={Math.round(size * 0.5)}>{roomIconEmoji(iconKey)}</WarmText>
    </View>
  );
}

/* ── 미션 출처 배지 (랜덤/직접) ─────────────────────────── */
export function SourceBadge({ source }) {
  const C = W;
  const isRandom = source === 'RANDOM';
  const tone = isRandom
    ? { bg: C.brownFaint, border: C.brownBorder, text: C.brown }
    : { bg: C.greenFaint, border: C.green, text: C.green };
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 3,
      borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2,
      borderColor: tone.border, backgroundColor: tone.bg,
    }}>
      <WarmText size={11}>{isRandom ? '🎲' : '✍️'}</WarmText>
      <WarmText v="caption" size={11} color={tone.text}>{isRandom ? '랜덤' : '직접'}</WarmText>
    </View>
  );
}

/* ── 진행률 바 ──────────────────────────────────────────── */
export function ProgressBar({ value = 0, total = 0, showLabel = true, height = 6 }) {
  const C = W;
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ flex: 1, height, borderRadius: height / 2, backgroundColor: C.greenSoft, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${pct}%`, borderRadius: height / 2, backgroundColor: C.green }} />
      </View>
      {showLabel && <WarmText v="caption" size={11} color={C.text}>{value}/{total} 인증</WarmText>}
    </View>
  );
}

/* ── 그린 버튼 / 아웃라인 버튼 ──────────────────────────── */
export function GreenButton({ label, onPress, disabled, style, ionicon, radius }) {
  const C = W;
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={disabled} style={style}>
      <View style={[btnStyles.green, disabled ? btnStyles.greenDisabled : { backgroundColor: C.green }, radius != null && { borderRadius: radius }]}>
        {ionicon ? <Ionicons name={ionicon} size={17} color={disabled ? C.text : '#fff9f3'} style={{ marginRight: 7 }} /> : null}
        <WarmText v="btn" style={disabled ? { color: C.text } : undefined}>{label}</WarmText>
      </View>
    </TouchableOpacity>
  );
}

export function OutlineButton({ label, onPress, style, ionicon }) {
  const C = W;
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[btnStyles.outline, { borderColor: C.greenBorder, backgroundColor: C.greenFaint }, style]}>
      {ionicon ? <Ionicons name={ionicon} size={16} color={C.green} style={{ marginRight: 7 }} /> : null}
      <WarmText v="section" size={15} color={C.green}>{label}</WarmText>
    </TouchableOpacity>
  );
}

const btnStyles = StyleSheet.create({
  green:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, paddingVertical: 16 },
  greenDisabled: { backgroundColor: W.neutralStrong, borderWidth: 1, borderColor: W.text },
  outline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, paddingVertical: 15, borderWidth: 1.5 },
});

/* ── 리액션 바 (기본 3종 항상 노출 + 자유 추가) ─────────── */
export function ReactionBar({ reactions = [], onToggle }) {
  const C = W;
  const [pickerOpen, setPickerOpen] = useState(false);

  // 기본 emoji + 서버 reactions 병합 (기본은 count 0이어도 노출)
  const map = new Map();
  DEFAULT_REACTIONS.forEach(e => map.set(e, { emoji: e, count: 0, mine: false }));
  reactions.forEach(r => map.set(r.emoji, { emoji: r.emoji, count: r.count ?? 0, mine: !!r.mine }));
  const list = Array.from(map.values());

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
      {list.map(r => (
        <TouchableOpacity
          key={r.emoji}
          activeOpacity={0.7}
          onPress={() => { H.tap(); onToggle?.(r.emoji); }}
          style={[reactStyles.chip, { borderColor: C.brown, backgroundColor: C.neutralStrong },
            r.mine && { borderColor: C.coral, backgroundColor: C.coralSoft }]}
        >
          <WarmText size={13}>{r.emoji}</WarmText>
          {r.count > 0 && <WarmText v="caption" size={12} color={C.text}>{r.count}</WarmText>}
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => { H.tap(); setPickerOpen(true); }}
        style={[reactStyles.chip, { borderColor: C.brown, backgroundColor: C.neutralStrong }]}
      >
        <Ionicons name="add" size={14} color={C.text} />
      </TouchableOpacity>

      <EmojiPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(emoji) => { setPickerOpen(false); H.tap(); onToggle?.(emoji); }}
      />
    </View>
  );
}

const reactStyles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, minWidth: 34, justifyContent: 'center' },
});

/* ── 이모지 피커 모달 ──────────────────────────────────── */
export function EmojiPickerModal({ visible, onClose, onPick }) {
  const C = W;
  const m = useMemo(() => makePickerStyles(C), [C]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={m.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={m.sheet}>
        <View style={m.handle} />
        <WarmText v="section" style={{ textAlign: 'center', marginBottom: 14 }}>리액션 선택</WarmText>
        <ScrollView contentContainerStyle={m.grid}>
          {EMOJI_PALETTE.map(e => (
            <TouchableOpacity key={e} style={m.cell} activeOpacity={0.7} onPress={() => onPick?.(e)}>
              <WarmText size={26}>{e}</WarmText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

function makePickerStyles(C) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet: {
      position: 'absolute', left: 0, right: 0, bottom: 0,
      backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      borderTopWidth: 1, borderColor: C.greenBorder, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36,
    },
    handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, marginBottom: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    cell: { width: '12.5%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  });
}

/* ── 콕 찌르기 칩 (Default → Sent 토글) ─────────────────── */
export function NudgeChip({ nudged, onPress }) {
  const C = W;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={nudged}
      onPress={() => { H.tap(); onPress?.(); }}
      style={[nudgeStyles.chip, { borderColor: C.borderStrong, backgroundColor: C.surface },
        nudged && { borderColor: C.greenBorder, backgroundColor: C.greenFaint }]}
    >
      <WarmText v="caption" size={11} color={nudged ? C.green : C.brown}>
        {nudged ? '✓ 콕 찔렀어요' : '👉 콕 찌르기'}
      </WarmText>
    </TouchableOpacity>
  );
}

const nudgeStyles = StyleSheet.create({
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
});

/* ── 인증 상태 배지 (VERIFIED / PENDING) ──────────────── */
export function ProofStatusBadge({ status }) {
  const C = W;
  const verified = status === 'VERIFIED';
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 4,
      borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
      backgroundColor: verified ? C.greenFaint : C.surface2,
    }}>
      <WarmText v="caption" size={11} color={verified ? C.green : C.textSub}>
        {verified ? '인증 완료' : '대기 중'}
      </WarmText>
    </View>
  );
}
