import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { W } from '../constants/warm';
import { api } from '../utils/api';
import WarmText from '../components/WarmText';
import AvatarImage from '../components/AvatarImage';
import { getAvatarSource } from '../utils/avatars';
import { RoomTopBar, OutlineButton } from '../components/RoomBits';
import * as H from '../utils/haptics';

export default function BlockedUsersScreen({ onBack }) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState(null); // 해제 중인 userId

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.get('/api/v1/users/me/blocks');
      setUsers(Array.isArray(res) ? res : []);
    } catch (e) {
      console.warn('차단 목록 로딩 실패:', e);
      setError(e?.message || '차단 목록을 불러오지 못했어요.');
    }
  }, []);

  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]);

  const handleUnblock = useCallback(async (userId) => {
    if (removing) return;
    H.tap();
    setRemoving(userId);
    try {
      await api.delete(`/api/v1/users/${userId}/block`);
      H.success();
      setUsers(prev => prev.filter(u => u.userId !== userId));
    } catch (e) {
      console.warn('차단 해제 실패:', e);
    } finally {
      setRemoving(null);
    }
  }, [removing]);

  return (
    <View style={s.screen}>
      <RoomTopBar title="차단한 사용자" onBack={onBack} />
      {loading ? (
        <View style={s.center}><ActivityIndicator color={C.green} /></View>
      ) : error ? (
        <View style={s.center}>
          <WarmText v="sub" style={{ textAlign: 'center', marginBottom: 12 }}>{error}</WarmText>
          <OutlineButton label="다시 시도하기" onPress={() => { setLoading(true); load().finally(() => setLoading(false)); }} />
        </View>
      ) : users.length === 0 ? (
        <View style={s.center}>
          <WarmText size={40} style={{ marginBottom: 12 }}>🙈</WarmText>
          <WarmText v="body" size={15} color={C.textSub}>차단한 사용자가 없어요</WarmText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.card}>
            {users.map((u, i) => (
              <React.Fragment key={u.userId}>
                {i > 0 ? <View style={s.divider} /> : null}
                <View style={s.row}>
                  <View style={s.avatarWrap}>
                    <AvatarImage source={getAvatarSource(u.avatarId)} width={40} height={40} />
                  </View>
                  <WarmText v="body" size={15} color={C.text} style={{ flex: 1 }} numberOfLines={1}>
                    {u.nickname}
                  </WarmText>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={removing === u.userId}
                    onPress={() => handleUnblock(u.userId)}
                    style={s.unblockBtn}
                  >
                    <WarmText v="caption" size={12} color={C.green}>
                      {removing === u.userId ? '해제 중…' : '차단 해제'}
                    </WarmText>
                  </TouchableOpacity>
                </View>
              </React.Fragment>
            ))}
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
    content: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 40 },
    card:    { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 16, overflow: 'hidden' },
    row:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    avatarWrap: {
      width: 40, height: 40, borderRadius: 20, overflow: 'hidden',
      borderWidth: 1, borderColor: C.borderStrong, backgroundColor: C.surface2,
      alignItems: 'center', justifyContent: 'center',
    },
    divider: { height: 1, width: '100%', backgroundColor: C.border },
    unblockBtn: {
      borderWidth: 1, borderColor: C.greenBorder, backgroundColor: C.greenFaint,
      borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    },
  });
}
