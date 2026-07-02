import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { W } from '../constants/warm';
import { api, BASE_URL } from '../utils/api';
import WarmText from '../components/WarmText';
import * as H from '../utils/haptics';
import { RoomTopBar, MemberAvatar, ProofStatusBadge, OutlineButton } from '../components/RoomBits';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function resolvePhoto(url) {
  if (!url) return null;
  return url.startsWith('/') ? `${BASE_URL}${url}` : url;
}

function pad2(n) { return String(n).padStart(2, '0'); }
function monthKey(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`; }
function parseDate(str) {
  if (!str) return null;
  const [y, m, day] = String(str).split('-').map(Number);
  return new Date(y, (m || 1) - 1, day || 1);
}

export default function RoomHistoryScreen({ roomId, onBack }) {
  const C = W;
  const s = useMemo(() => makeStyles(C), [C]);

  const [month, setMonth] = useState(() => new Date());
  const [days, setDays] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.get(`/api/v1/rooms/${roomId}/history?month=${monthKey(month)}`);
      const arr = Array.isArray(res) ? res : [];
      setDays(arr);
      setSelected(arr.length > 0 ? arr[0].date : null);
    } catch (e) {
      console.warn('지난 기록 로딩 실패:', e);
      setError(e?.message || '기록을 불러오지 못했어요.');
    }
  }, [roomId, month]);

  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]);

  const shiftMonth = (delta) => {
    H.tap();
    setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const selectedDay = days.find(d => d.date === selected) ?? null;

  return (
    <View style={s.screen}>
      <RoomTopBar title="지난 기록 보기" onBack={onBack} />

      <View style={s.monthRow}>
        <TouchableOpacity onPress={() => shiftMonth(-1)} hitSlop={10} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={C.textSub} />
        </TouchableOpacity>
        <WarmText v="title" size={18}>{month.getFullYear()}년 {month.getMonth() + 1}월</WarmText>
        <TouchableOpacity onPress={() => shiftMonth(1)} hitSlop={10} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={20} color={C.textSub} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={C.green} /></View>
      ) : error ? (
        <View style={s.center}>
          <WarmText v="sub" style={{ textAlign: 'center', marginBottom: 12 }}>{error}</WarmText>
          <OutlineButton label="다시 시도" onPress={() => { setLoading(true); load().finally(() => setLoading(false)); }} />
        </View>
      ) : days.length === 0 ? (
        <View style={s.center}>
          <WarmText size={28} style={{ marginBottom: 8 }}>📅</WarmText>
          <WarmText v="sub" style={{ textAlign: 'center' }}>이 달의 인증 기록이 없어요</WarmText>
        </View>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dateStrip}>
            {days.map(d => {
              const dt = parseDate(d.date);
              const active = selected === d.date;
              return (
                <TouchableOpacity
                  key={d.date}
                  activeOpacity={0.8}
                  onPress={() => { H.tap(); setSelected(d.date); }}
                  style={[s.dateChip, active && { borderColor: C.greenBorder, backgroundColor: C.greenFaint }]}
                >
                  <WarmText v="section" size={17} color={active ? C.green : C.text}>{dt ? dt.getDate() : '-'}</WarmText>
                  <WarmText v="caption" size={11} color={active ? C.green : C.textSub}>{dt ? WEEKDAYS[dt.getDay()] : ''}</WarmText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
            {selectedDay ? (
              <>
                <View style={s.dayHead}>
                  <WarmText v="section" size={16}>
                    {parseDate(selectedDay.date)?.getMonth() + 1}월 {parseDate(selectedDay.date)?.getDate()}일 ({WEEKDAYS[parseDate(selectedDay.date)?.getDay()]})
                  </WarmText>
                  <WarmText v="caption">{selectedDay.confirmedCount ?? 0}명 인증</WarmText>
                </View>
                {selectedDay.mission ? (
                  <View style={s.missionRow}>
                    <WarmText size={18}>{selectedDay.mission.icon}</WarmText>
                    <WarmText v="body" size={14} style={{ flex: 1 }}>{selectedDay.mission.title}</WarmText>
                  </View>
                ) : null}

                <View style={{ marginTop: 16, gap: 16 }}>
                  {(selectedDay.proofs ?? []).map((p, i) => {
                    const photo = resolvePhoto(p.photoUrl);
                    return (
                      <View key={i} style={s.timelineRow}>
                        <View style={s.timelineLeft}>
                          <WarmText v="caption" size={11}>{p.time}</WarmText>
                          <View style={[s.dot, { backgroundColor: p.status === 'VERIFIED' ? C.green : C.textSub }]} />
                        </View>
                        {photo ? (
                          <Image source={{ uri: photo }} style={s.thumb} resizeMode="cover" />
                        ) : (
                          <View style={[s.thumb, s.thumbEmpty]}><WarmText size={28}>📷</WarmText></View>
                        )}
                        <View style={{ flex: 1, gap: 6 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <MemberAvatar avatarId={p.authorAvatarId} size={24} />
                            <WarmText v="body" size={13}>{p.authorNickname}</WarmText>
                          </View>
                          <View style={{ alignSelf: 'flex-start' }}><ProofStatusBadge status={p.status} /></View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            ) : null}
          </ScrollView>
        </>
      )}
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: C.bg },
    center:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, paddingVertical: 10 },
    dateStrip: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
    dateChip: { width: 52, height: 64, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', gap: 4 },
    dayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 8 },
    missionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    timelineLeft: { width: 40, alignItems: 'center', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    thumb: { width: 80, height: 80, borderRadius: 12, backgroundColor: C.surface2 },
    thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  });
}
