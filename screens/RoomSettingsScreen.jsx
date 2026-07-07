import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Share, Alert, ActivityIndicator,
} from 'react-native';
import { W } from '../constants/warm';
import { api } from '../utils/api';
import WarmText from '../components/WarmText';
import * as H from '../utils/haptics';
import { RoomTopBar, MemberAvatar } from '../components/RoomBits';
import { roomIconEmoji } from '../constants/rooms';
import { buildInviteUrl } from '../utils/invite';

export default function RoomSettingsScreen({ roomId, onBack, onLeft, onChanged }) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/api/v1/rooms/${roomId}`);
      setRoom(res);
      setName(res?.name ?? '');
    } catch (e) {
      console.warn('방 설정 로딩 실패:', e);
    }
  }, [roomId]);

  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]);

  const solo = room?.type === 'SOLO';
  const isOwner = !!room?.isOwner;

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === room?.name) return;
    try {
      await api.patch(`/api/v1/rooms/${roomId}`, { name: trimmed });
      onChanged?.();
    } catch (e) {
      console.warn('방 이름 변경 실패:', e);
    }
  };

  const shareCode = () => {
    if (!room?.inviteCode) return;
    H.tap();
    const url = buildInviteUrl(room.inviteCode);
    Share.share({
      message: `오프모드 '${room.name}' 방에 초대합니다 🌙\n초대코드: ${room.inviteCode}\n\n▼ 아래 링크로 바로 참여하기\n${url}`,
    }).catch(() => {});
  };

  const kick = (member) => {
    Alert.alert(`${member.nickname}님을 내보낼까요?`, '이 방에서 빠지게 됩니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '내보내기', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/v1/rooms/${roomId}/members/${member.memberId}`);
            await load();
            onChanged?.();
          } catch (e) {
            console.warn('멤버 내보내기 실패:', e);
          }
        },
      },
    ]);
  };

  const leave = () => {
    Alert.alert(
      solo ? '방을 나갈까요?' : '방을 나갈까요?',
      solo ? '오늘 미션과 인증 기록에서 빠지게 됩니다.' : '이 방의 인증 기록에서 빠지게 됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '나가기', style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/v1/rooms/${roomId}/members/me`);
            } catch (e) {
              console.warn('방 나가기 실패:', e);
            }
            onLeft?.();
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[s.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={C.green} />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <RoomTopBar title="방 설정" onBack={onBack} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <WarmText v="label" style={s.label}>방 이름</WarmText>
        <TextInput
          value={name}
          onChangeText={setName}
          onBlur={saveName}
          maxLength={16}
          editable={isOwner}
          style={[s.input, !isOwner && { opacity: 0.6 }]}
        />

        {!solo ? (
          <>
            <WarmText v="label" style={s.label}>초대코드</WarmText>
            <View style={s.codeRow}>
              <WarmText v="title" size={20} style={{ letterSpacing: 3, flex: 1 }}>{room?.inviteCode ?? '------'}</WarmText>
              <TouchableOpacity activeOpacity={0.8} onPress={shareCode} style={s.shareBtn}>
                <WarmText v="caption" size={13} color={C.green}>🔗 공유</WarmText>
              </TouchableOpacity>
            </View>

            <WarmText v="label" style={s.label}>멤버 {room?.memberCount ?? room?.members?.length ?? 0}명</WarmText>
            <View style={{ gap: 8 }}>
              {(room?.members ?? []).map(m => (
                <View key={m.memberId} style={s.memberRow}>
                  <MemberAvatar avatarId={m.avatarId} size={34} />
                  <WarmText v="body" size={14} style={{ flex: 1 }}>{m.nickname}</WarmText>
                  {m.role === 'OWNER' ? (
                    <WarmText v="caption" color={C.brown}>방장</WarmText>
                  ) : isOwner ? (
                    <TouchableOpacity activeOpacity={0.7} onPress={() => kick(m)}>
                      <WarmText v="caption" color={C.coral}>내보내기</WarmText>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={s.soloInfo}>
            <WarmText size={26} style={{ marginBottom: 6 }}>{roomIconEmoji(room?.iconKey)}</WarmText>
            <WarmText v="sub" style={{ textAlign: 'center' }}>혼자 수행하는 방이에요</WarmText>
          </View>
        )}

        <TouchableOpacity activeOpacity={0.8} onPress={leave} style={s.dangerBtn}>
          <WarmText v="section" size={15} color={C.coral}>방 나가기</WarmText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: C.bg },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    label:   { marginTop: 20, marginBottom: 10 },
    input:   { backgroundColor: C.neutralSoft, borderWidth: 1, borderColor: C.borderStrong, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontFamily: 'GmarketSansLight', fontSize: 15, color: C.text },
    codeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
    shareBtn: { borderWidth: 1, borderColor: C.green, backgroundColor: C.greenFaint, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
    memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderStrong, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
    soloInfo: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingVertical: 24, alignItems: 'center', marginTop: 4 },
    dangerBtn: { alignItems: 'center', borderWidth: 1, borderColor: C.coralBorder, backgroundColor: C.coralFaint, borderRadius: 16, paddingVertical: 15, marginTop: 28 },
  });
}
