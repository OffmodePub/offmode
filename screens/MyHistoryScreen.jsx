import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { W } from '../constants/warm';
import { api, BASE_URL } from '../utils/api';
import WarmText from '../components/WarmText';
import * as H from '../utils/haptics';
import { RoomIcon, ProofStatusBadge } from '../components/RoomBits';
import { usePagerBottomBarHeight } from '../components/PageIndicator';
import { pad } from '../utils/date';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTHS_BACK = 6; // 조회 가능한 과거 개월 수

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
function mkStr(y, m0) { return `${y}-${pad(m0 + 1)}`; } // m0 = 0-based month

// 해당 월의 달력 그리드 생성 — 일요일 시작, 주(7칸) 단위 행. 월 밖 칸은 null.
function buildMonthGrid(year, m0) {
  const first = new Date(year, m0, 1);
  const daysInMonth = new Date(year, m0 + 1, 0).getDate();
  const weeks = [];
  let week = new Array(first.getDay()).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(dateStr(new Date(year, m0, day)));
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) weeks.push([...week, ...new Array(7 - week.length).fill(null)]);
  return weeks;
}

function emptyRecord(date) {
  return { date, proofs: [] };
}

export default function MyHistoryScreen() {
  const C = W;
  const pagerBottom = usePagerBottomBarHeight(); // 플로팅 인디케이터+인셋 높이

  const today = useMemo(() => startOfDay(new Date()), []);
  const todayStr = useMemo(() => dateStr(today), [today]);

  // 표시 중인 월 (0 = 이번 달, 커질수록 과거)
  const [monthBack, setMonthBack] = useState(0);
  const [selected, setSelected] = useState(todayStr);
  const [recordsByMonth, setRecordsByMonth] = useState({}); // { 'YYYY-MM': { 'YYYY-MM-DD': record } }
  const loadedRef = useRef(new Set()); // 로드 시도한 월 (중복 요청 방지)

  const s = useMemo(() => makeStyles(C), [C]);

  const viewDate = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() - monthBack, 1),
    [today, monthBack],
  );
  const viewMk = mkStr(viewDate.getFullYear(), viewDate.getMonth());
  const grid = useMemo(
    () => buildMonthGrid(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate],
  );

  const ensureMonth = useCallback(async (mk) => {
    if (loadedRef.current.has(mk)) return;
    loadedRef.current.add(mk);
    try {
      const res = await api.get(`/api/v1/rooms/me/history?month=${mk}`);
      const arr = Array.isArray(res) ? res : [];
      const map = {};
      arr.forEach((r) => { map[r.date] = r; });
      setRecordsByMonth((prev) => ({ ...prev, [mk]: map }));
    } catch (e) {
      if (__DEV__) console.warn('내 기록 월 로딩 실패:', mk, e?.message);
      setRecordsByMonth((prev) => ({ ...prev, [mk]: prev[mk] ?? {} })); // 빈 값으로 확정
    }
  }, []);

  // 표시 중인 월 로드
  useEffect(() => { ensureMonth(viewMk); }, [viewMk, ensureMonth]);

  const canGoPrev = monthBack < MONTHS_BACK;
  const canGoNext = monthBack > 0;

  const moveMonth = (delta) => {
    const next = monthBack - delta; // delta +1 = 다음 달(미래 방향)
    if (next < 0 || next > MONTHS_BACK) return;
    H.tap();
    setMonthBack(next);
    // 선택일이 새 월 밖이면: 이번 달이면 오늘, 과거 달이면 1일 선택
    const nd = new Date(today.getFullYear(), today.getMonth() - next, 1);
    const nmk = mkStr(nd.getFullYear(), nd.getMonth());
    setSelected((prev) => (mkOf(prev) === nmk ? prev : next === 0 ? todayStr : dateStr(nd)));
  };

  const selMk = mkOf(selected);
  const selMonthReady = recordsByMonth[selMk] !== undefined;
  const selectedDay = selMonthReady ? (recordsByMonth[selMk][selected] ?? emptyRecord(selected)) : null;

  return (
    <View style={s.screen}>
      <View style={s.header}>
        <WarmText v="title" size={20}>내 기록</WarmText>
        <WarmText v="sub" size={13} color={C.brown} style={{ marginTop: 4 }}>
          내가 인증한 순간들을 모아봤어요
        </WarmText>
      </View>

      <View style={s.monthRow}>
        <TouchableOpacity
          onPress={() => moveMonth(-1)}
          disabled={!canGoPrev}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[s.monthBtn, !canGoPrev && { opacity: 0.25 }]}
        >
          <Ionicons name="chevron-back" size={18} color={C.text} />
        </TouchableOpacity>
        <WarmText v="title" size={16} style={s.monthLabel}>
          {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
        </WarmText>
        <TouchableOpacity
          onPress={() => moveMonth(1)}
          disabled={!canGoNext}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[s.monthBtn, !canGoNext && { opacity: 0.25 }]}
        >
          <Ionicons name="chevron-forward" size={18} color={C.text} />
        </TouchableOpacity>
      </View>

      <View style={s.calendar}>
        <View style={s.weekRow}>
          {WEEKDAYS.map((w) => (
            <View key={w} style={s.cell}>
              <WarmText v="caption" size={11} color={C.textSub}>{w}</WarmText>
            </View>
          ))}
        </View>
        {grid.map((week, wi) => (
          <View key={wi} style={s.weekRow}>
            {week.map((ds, di) => {
              if (!ds) return <View key={di} style={s.cell} />;
              const future = ds > todayStr;
              const active = selected === ds;
              const rec = recordsByMonth[mkOf(ds)]?.[ds];
              const hasRecord = !!rec?.proofs?.length;
              const fg = active ? C.green : future ? C.textSub : C.text;
              return (
                <View key={ds} style={s.cell}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={future}
                    onPress={() => { H.tap(); setSelected(ds); }}
                    style={[s.dayChip, active && s.dayChipActive, future && { opacity: 0.35 }]}
                  >
                    <WarmText v="section" size={14} color={fg}>{parseDate(ds).getDate()}</WarmText>
                  </TouchableOpacity>
                  <View style={[s.recDot, hasRecord && { backgroundColor: C.green }]} />
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <ScrollView
        style={s.contentScroll}
        contentContainerStyle={[s.content, { paddingBottom: 40 + pagerBottom }]}
        showsVerticalScrollIndicator={false}
      >
        {!selMonthReady ? (
          <View style={s.detailLoading}><ActivityIndicator color={C.green} /></View>
        ) : selectedDay ? (
          <>
            <View style={s.dayHead}>
              <WarmText v="section" size={15}>
                {parseDate(selectedDay.date)?.getMonth() + 1}월 {parseDate(selectedDay.date)?.getDate()}일 ({WEEKDAYS[parseDate(selectedDay.date)?.getDay()]})
              </WarmText>
              <WarmText v="caption" size={12}>인증 {selectedDay.proofs?.length ?? 0}개</WarmText>
            </View>

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
                            <RoomIcon iconKey={p.roomIconKey} size={24} />
                            <WarmText v="body" size={13} numberOfLines={1} style={{ flexShrink: 1 }}>{p.roomName}</WarmText>
                          </View>
                          {p.mission ? (
                            <WarmText v="caption" size={12} color={C.brown} numberOfLines={1}>
                              {p.mission.icon} {p.mission.title}
                            </WarmText>
                          ) : null}
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

function makeStyles(C) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: C.bg },
    header:  { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4 },
    contentScroll: { flex: 1 },
    content: { paddingHorizontal: 20, paddingTop: 8 },
    detailLoading: { paddingVertical: 40, alignItems: 'center' },

    monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
    monthLabel: { minWidth: 110, textAlign: 'center' },
    monthBtn: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, borderColor: C.borderStrong, backgroundColor: C.neutralFaint, alignItems: 'center', justifyContent: 'center' },

    calendar: { paddingHorizontal: 12, paddingBottom: 6 },
    weekRow: { flexDirection: 'row' },
    cell: { flex: 1, alignItems: 'center', paddingVertical: 2 },
    dayChip: { width: 36, height: 36, borderRadius: 12, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
    dayChipActive: { borderColor: C.greenBorderStrong, backgroundColor: C.greenFaint },
    recDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'transparent' },

    dayHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
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
