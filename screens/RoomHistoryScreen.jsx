import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { W } from '../constants/warm';
import { api, BASE_URL } from '../utils/api';
import WarmText from '../components/WarmText';
import * as H from '../utils/haptics';
import { RoomTopBar, MemberAvatar, ProofStatusBadge } from '../components/RoomBits';
import { pad } from '../utils/date';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const WINDOWS_BACK = 26; // 표시 가능한 과거 7일 창 수 (약 6개월)

function resolvePhoto(url) {
  if (!url) return null;
  return url.startsWith('/') ? `${BASE_URL}${url}` : url;
}

function parseDate(str) {
  if (!str) return null;
  const [y, m, day] = String(str).split('-').map(Number);
  return new Date(y, (m || 1) - 1, day || 1);
}

function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function dateStr(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function mkOf(ds) { return ds.slice(0, 7); } // 'YYYY-MM'

// 오늘부터 7일씩 과거로 묶은 창들을 생성.
// 반환: index 0 = 오늘이 포함된 최신 7일, index가 커질수록 과거.
// 각 창 내부는 최신→과거 순서(왼쪽이 최신).
function buildWindows(today, numWindows) {
  const windows = [];
  for (let w = 0; w < numWindows; w++) {
    const win = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - (w * 7 + i));
      win.push(dateStr(d));
    }
    windows.push(win);
  }
  return windows;
}

function emptyRecord(date) {
  return { date, confirmedCount: 0, mission: null, proofs: [] };
}

export default function RoomHistoryScreen({ roomId, onBack }) {
  const C = W;

  const today = useMemo(() => startOfDay(new Date()), []);
  const todayStr = useMemo(() => dateStr(today), [today]);
  const windows = useMemo(() => buildWindows(today, WINDOWS_BACK), [today]);

  const [stripW, setStripW] = useState(0);
  const [winIdx, setWinIdx] = useState(0); // 현재 보이는 7일 창 (기본: 오늘 포함 최신)
  const [selected, setSelected] = useState(todayStr);
  const [recordsByMonth, setRecordsByMonth] = useState({}); // { 'YYYY-MM': { 'YYYY-MM-DD': record } }

  const scrollRef = useRef(null);
  const loadedRef = useRef(new Set()); // 로드 시도한 월 (중복 요청 방지)

  const s = useMemo(() => makeStyles(C, stripW), [C, stripW]);

  const ensureMonth = useCallback(async (mk) => {
    if (loadedRef.current.has(mk)) return;
    loadedRef.current.add(mk);
    try {
      const res = await api.get(`/api/v1/rooms/${roomId}/history?month=${mk}`);
      const arr = Array.isArray(res) ? res : [];
      const map = {};
      arr.forEach((r) => { map[r.date] = r; });
      setRecordsByMonth((prev) => ({ ...prev, [mk]: map }));
    } catch (e) {
      if (__DEV__) console.warn('지난 기록 월 로딩 실패:', mk, e?.message);
      setRecordsByMonth((prev) => ({ ...prev, [mk]: prev[mk] ?? {} })); // 빈 값으로 확정
    }
  }, [roomId]);

  // 방이 바뀌면 캐시 초기화
  useEffect(() => {
    loadedRef.current = new Set();
    setRecordsByMonth({});
  }, [roomId]);

  // 보이는 7일 창이 걸친 월(들)을 로드
  useEffect(() => {
    const win = windows[winIdx];
    if (!win) return;
    const mks = [...new Set([mkOf(win[0]), mkOf(win[6])])];
    mks.forEach(ensureMonth);
  }, [winIdx, windows, ensureMonth]);

  const onStripScroll = (e) => {
    if (stripW <= 0) return;
    const idx = Math.round(e.nativeEvent.contentOffset.x / stripW);
    const clamped = Math.max(0, Math.min(windows.length - 1, idx));
    if (clamped !== winIdx) setWinIdx(clamped);
  };

  // 상단 월 라벨: 보이는 창의 가운데 날짜를 기준으로
  const labelDate = parseDate(windows[winIdx]?.[3] ?? todayStr);

  const selMk = mkOf(selected);
  const selMonthReady = recordsByMonth[selMk] !== undefined;
  const selectedDay = selMonthReady ? (recordsByMonth[selMk][selected] ?? emptyRecord(selected)) : null;

  return (
    <View style={s.screen}>
      <RoomTopBar title="지난 기록 보기" onBack={onBack} />

      <View style={s.monthRow}>
        <WarmText v="title" size={16}>
          {labelDate.getFullYear()}년 {labelDate.getMonth() + 1}월
        </WarmText>
      </View>

      <View style={s.stripWrap} onLayout={(e) => setStripW(e.nativeEvent.layout.width)}>
        {stripW > 0 ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: winIdx * stripW, y: 0 }}
            onMomentumScrollEnd={onStripScroll}
          >
            {windows.map((win, wi) => (
              <View key={wi} style={s.page}>
                {win.map((ds) => {
                  const dt = parseDate(ds);
                  const active = selected === ds;
                  const rec = recordsByMonth[mkOf(ds)]?.[ds];
                  const hasRecord = !!(rec && (rec.proofs?.length || rec.confirmedCount));
                  const fg = active ? C.green : C.text;
                  return (
                    <View key={ds} style={s.col}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => { H.tap(); setSelected(ds); }}
                        style={[s.dateChip, active && s.dateChipActive]}
                      >
                        <WarmText v="section" size={15} color={fg}>{dt.getDate()}</WarmText>
                        <WarmText v="caption" size={11} color={fg}>{WEEKDAYS[dt.getDay()]}</WarmText>
                      </TouchableOpacity>
                      <View style={[s.recDot, hasRecord && { backgroundColor: C.green }]} />
                    </View>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>

      <ScrollView style={s.contentScroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {!selMonthReady ? (
          <View style={s.detailLoading}><ActivityIndicator color={C.green} /></View>
        ) : selectedDay ? (
          <>
            <View style={s.dayHead}>
              <WarmText v="section" size={15}>
                {parseDate(selectedDay.date)?.getMonth() + 1}월 {parseDate(selectedDay.date)?.getDate()}일 ({WEEKDAYS[parseDate(selectedDay.date)?.getDay()]})
              </WarmText>
              <WarmText v="caption" size={12}>{selectedDay.confirmedCount ?? 0}명 인증</WarmText>
            </View>
            {selectedDay.mission ? (
              <WarmText size={13} color={C.brown} style={s.missionLine}>
                {selectedDay.mission.icon} {selectedDay.mission.title}
              </WarmText>
            ) : null}

            {(selectedDay.proofs ?? []).length === 0 ? (
              <WarmText v="sub" size={13} color={C.textSub} style={{ marginTop: 12 }}>
                이날은 인증 기록이 없어요.
              </WarmText>
            ) : (
              <View style={{ marginTop: 12 }}>
                {(selectedDay.proofs ?? []).map((p, i, arr) => {
                  const photo = resolvePhoto(p.photoUrl);
                  const isLast = i === arr.length - 1;
                  return (
                    <View key={i} style={s.timelineRow}>
                      <View style={s.timeCol}>
                        <WarmText v="caption" size={12}>{p.time}</WarmText>
                      </View>
                      <View style={s.dotCol}>
                        <View style={[s.dot, { backgroundColor: p.status === 'VERIFIED' ? C.green : C.textSub }]} />
                        {!isLast ? <View style={s.dotLine} /> : null}
                      </View>
                      <View style={[s.entryBody, !isLast && { paddingBottom: 18 }]}>
                        {photo ? (
                          <Image source={{ uri: photo }} style={s.thumb} resizeMode="cover" />
                        ) : (
                          <View style={[s.thumb, s.thumbEmpty]}><WarmText size={28}>📷</WarmText></View>
                        )}
                        <View style={{ flex: 1, gap: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <MemberAvatar avatarId={p.authorAvatarId} size={24} />
                            <WarmText v="body" size={13}>{p.authorNickname}</WarmText>
                          </View>
                          <View style={{ alignSelf: 'flex-start' }}><ProofStatusBadge status={p.status} /></View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function makeStyles(C, stripW) {
  const colW = stripW > 0 ? (stripW - 16) / 7 : 0;
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: C.bg },
    contentScroll: { flex: 1 },
    content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
    monthRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
    detailLoading: { paddingVertical: 40, alignItems: 'center' },

    stripWrap: { paddingBottom: 6 },
    page: { width: stripW, flexDirection: 'row', paddingHorizontal: 8 },
    col: { width: colW, alignItems: 'center' },
    dateChip: { width: Math.min(46, Math.max(0, colW - 6)), height: 52, borderRadius: 14, borderWidth: 1, borderColor: C.borderStrong, backgroundColor: C.neutralFaint, alignItems: 'center', justifyContent: 'center', gap: 2 },
    dateChipActive: { borderColor: C.greenBorderStrong, backgroundColor: C.greenFaint },
    recDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 4, backgroundColor: 'transparent' },

    dayHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    missionLine: { marginTop: 3 },
    timelineRow: { flexDirection: 'row', gap: 10 },
    timeCol: { width: 46 },
    dotCol: { width: 16, alignItems: 'center', paddingTop: 2, gap: 4 },
    dot: { width: 11, height: 11, borderRadius: 5.5 },
    dotLine: { flex: 1, width: 2, borderRadius: 1, backgroundColor: C.border },
    entryBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    thumb: { width: 150, height: 112, borderRadius: 12, backgroundColor: C.surface2 },
    thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  });
}
