import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, Image, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../utils/useColors';
import { api, BASE_URL } from '../utils/api';
import T from '../components/ThemedText';
import Svg, { Path, G, Defs, ClipPath, Rect } from 'react-native-svg';

// imageFile (백엔드) → local require 매핑
const BADGE_IMAGE_MAP = {
  'badge_time_dawn_dawnmaster.png':           require('../assets/badge_time_dawn_dawnmaster.png'),
  'badge_time_afternoon_freeman.png':         require('../assets/badge_time_afternoon_freeman.png'),
  'badge_time_evening_timewarden.png':        require('../assets/badge_time_evening_timewarden.png'),
  'badge_activity_walker_walker.png':         require('../assets/badge_activity_walker_walker.png'),
  'badge_activity_routine_manager.png':       require('../assets/badge_activity_routine_manager.png'),
  'badge_activity_beauty_curator.png':        require('../assets/badge_activity_beauty_curator.png'),
  'badge_activity_local_hipster.png':         require('../assets/badge_activity_local_hipster.png'),
  'badge_explore_lv01_initiate.png':          require('../assets/badge_explore_lv01_initiate.png'),
  'badge_explore_lv02_explorer.png':          require('../assets/badge_explore_lv02_explorer.png'),
  'badge_real_world_ruler.png':               require('../assets/badge_real_world_ruler.png'),
  'badge_unique_speedrunner_streakking.png':  require('../assets/badge_unique_speedrunner_streakking.png'),
  'image_45.png': require('../assets/expansion.png'),
};

const F = 'Kkukkukk';
const { width } = Dimensions.get('window');

const GRAD_FOR_CAT = {
  Energy:    ['#acd8a7', '#2e7d4f'],
  Intellect: ['#c3aef0', '#5a2da0'],
  Vitality:  ['#87ceeb', '#2a7ab8'],
};

function parseLocalDT(val) {
  if (!val) return null;
  if (Array.isArray(val)) {
    const [y, mo, d, h = 0, mi = 0] = val;
    return new Date(y, mo - 1, d, h, mi);
  }
  return new Date(val);
}

function pad2(n) { return String(n).padStart(2, '0'); }

function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekLabel(monday) {
  const y = monday.getFullYear();
  const m = monday.getMonth() + 1;
  const weekOfMonth = Math.ceil(monday.getDate() / 7);
  return `${y}년 ${m}월 ${weekOfMonth}주`;
}

function toHistoryItem(m) {
  const dt = parseLocalDT(m.assignedAt);
  if (!dt) return null;
  const weekKey = getMondayOfWeek(dt).getTime();
  return {
    weekKey,
    fullDate: `${dt.getFullYear()}.${pad2(dt.getMonth()+1)}.${pad2(dt.getDate())}`,
    time: `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`,
    icon: m.missionIcon,
    mission: m.missionText,
    category: m.missionCategory,
    grad: GRAD_FOR_CAT[m.missionCategory] ?? ['#888', '#444'],
    verified: m.status === 'verified',
    photoUrl: m.photoUrl ? `${BASE_URL}${m.photoUrl}` : null,
    dt,
  };
}

function computeWeekGroups(history) {
  const groups = {};
  history.forEach(h => {
    if (!h?.weekKey) return;
    if (!groups[h.weekKey]) groups[h.weekKey] = [];
    groups[h.weekKey].push(h);
  });
  const sortedKeys = Object.keys(groups).sort((a, b) => Number(b) - Number(a));
  return {
    weekLabels: sortedKeys.map(k => getWeekLabel(new Date(Number(k)))),
    weekGroups: sortedKeys.map(k => groups[k]),
  };
}

function computeWeekData(history) {
  const monday = getMondayOfWeek(new Date());
  const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일'];
  return DAY_NAMES.map((day, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
    const done = history.some(h => {
      if (!h?.dt) return false;
      const hKey = `${h.dt.getFullYear()}-${pad2(h.dt.getMonth()+1)}-${pad2(h.dt.getDate())}`;
      return hKey === key && h.verified;
    });
    return { day, done };
  });
}

function formatJoinDate(val) {
  const dt = parseLocalDT(val);
  if (!dt) return '';
  return `${dt.getFullYear()}.${pad2(dt.getMonth()+1)}.${pad2(dt.getDate())} 합류`;
}

function ZoomIcon({ color, size = 14 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <G clipPath="url(#clip0_1545_8762)">
        <Path d="M5.92 11.34C8.91338 11.34 11.34 8.91338 11.34 5.92C11.34 2.92662 8.91338 0.5 5.92 0.5C2.92662 0.5 0.5 2.92662 0.5 5.92C0.5 8.91338 2.92662 11.34 5.92 11.34Z" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M13.5 13.5L9.75 9.75" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M6 3.5V8.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M3.5 6H8.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </G>
      <Defs>
        <ClipPath id="clip0_1545_8762">
          <Rect width="14" height="14" fill="white"/>
        </ClipPath>
      </Defs>
    </Svg>
  );
}

function SparkLine({ w = 160, h = 44 }) {
  const C = useColors();
  const pts = [12, 28, 20, 45, 38, 60, 52, 75, 65, 82, 70, 88];
  const max = Math.max(...pts);
  const coords = pts.map((p, i) => ({
    x: (i / (pts.length - 1)) * w,
    y: h - (p / max) * (h - 6) - 3,
  }));
  return (
    <View style={{ width: w, height: h }}>
      {coords.slice(0, -1).map((c, i) => {
        const next = coords[i + 1];
        const dx = next.x - c.x, dy = next.y - c.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <View key={i} style={{ position: 'absolute', left: c.x, top: c.y - 1, width: len, height: 2, backgroundColor: C.green, opacity: 0.65, transformOrigin: 'left center', transform: [{ rotate: `${angle}deg` }] }} />
        );
      })}
      <View style={{ position: 'absolute', left: coords[coords.length-1].x - 5, top: coords[coords.length-1].y - 5, width: 10, height: 10, borderRadius: 5, backgroundColor: C.green, borderWidth: 2, borderColor: C.bg }} />
    </View>
  );
}

function StatBar({ label, color, fill, level, s }) {
  return (
    <View style={s.statRow}>
      <T v="sub" style={{ width: 62 }}>{label}</T>
      <View style={s.statTrack}>
        <View style={[s.statFill, { width: `${fill}%`, backgroundColor: color }]} />
      </View>
      <View style={[s.statLvBadge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
        <T v="caption" style={{ color }}>Lv.{level}</T>
      </View>
    </View>
  );
}

function WeeklyActivity({ s, C, weekData }) {
  const streak = weekData.filter(d => d.done).length;
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <T v="section" size={17}>이번 주 활동</T>
        <View style={s.streakBadge}><T v="label" style={{ color: '#ff6b35' }}>🔥 {streak}일 완료</T></View>
      </View>
      <View style={s.weekRow}>
        {weekData.map((d, i) => (
          <View key={i} style={s.dayCol}>
            <View style={[s.dayBox, d.done && s.dayBoxDone]}>
              {d.done && <T v="green">✓</T>}
            </View>
            <T v="label" style={d.done ? { color: C.green } : undefined}>{d.day}</T>
          </View>
        ))}
      </View>
    </View>
  );
}

function BadgeGrid({ s, C, badges, mainBadge }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? badges : badges.slice(0, 6);
  const [selectedBadge, setSelectedBadge] = useState(null);

  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <T v="section" size={17}>칭호 & 배지</T>
        <TouchableOpacity onPress={() => setExpanded(e => !e)} activeOpacity={0.7}>
          <T v="green" size={12}>{expanded ? '접기' : '전체 보기'}</T>
        </TouchableOpacity>
      </View>
      {mainBadge && mainBadge.imageFile && (
        <View style={s.titleTagRow}>
          <LinearGradient colors={[C.purpleFaint, C.blueFaint]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.mainTitleTag}>
            <Image source={BADGE_IMAGE_MAP[mainBadge.imageFile]} style={s.mainTitleBadgeImg} resizeMode="contain" />
            <View>
              <T v="section" size={16} style={{ marginBottom: 2 }}>{mainBadge.name}</T>
              <T v="label" size={13}>{mainBadge.description}</T>
            </View>
          </LinearGradient>
        </View>
      )}
      
      <View style={s.badgeGrid}>
        {shown.map((b, i) => (
          <TouchableOpacity 
            key={b.key ?? i} 
            style={[s.badgeCard, !b.earned && s.badgeCardLocked]}
            activeOpacity={0.7}
            onPress={() => setSelectedBadge(b)}
          >
            <View style={s.cardZoomIconWrap}>
              <ZoomIcon color={C.textSub} size={15} /> 
            </View>

            {b.imageFile ? (
              <Image
                source={BADGE_IMAGE_MAP[b.imageFile]}
                style={[s.badgeImg, !b.earned && { opacity: 0.4 }]}
                resizeMode="contain"
              />
            ) : (
              <View style={[s.badgeImgPlaceholder, !b.earned && { opacity: 0.4 }]}>
                <Text style={{ fontSize: 28 }}>🏅</Text>
              </View>
            )}
            <T v="label" color={b.earned ? C.text : C.textSub} style={[{ textAlign: 'center' }, !b.earned && { opacity: 0.4 }]} numberOfLines={1}>{b.name}</T>
            <T v="caption" style={{ textAlign: 'center', lineHeight: 13, opacity: 0.8 }} numberOfLines={2}>{b.description}</T>
            {!b.earned && <T v="caption" size={9} style={{ opacity: 0.8 }}>잠김</T>}
          </TouchableOpacity>
        ))}
      </View>
      <Modal
        visible={!!selectedBadge}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            {selectedBadge && (
              <>
                {selectedBadge.imageFile ? (
                  <Image
                    source={BADGE_IMAGE_MAP[selectedBadge.imageFile]}
                    style={[s.modalBadgeImg, !selectedBadge.earned && { opacity: 0.3 }]}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={[s.modalBadgeImgPlaceholder, !selectedBadge.earned && { opacity: 0.3 }]}>
                    <Text style={{ fontSize: 50 }}>🏅</Text>
                  </View>
                )}
                
                <T v="title" size={20} style={{ marginTop: 20, marginBottom: 8 }}>
                  {selectedBadge.name}
                </T>
                
                <T v="sub" style={{ textAlign: 'center', opacity: 0.8, marginBottom: 24, lineHeight: 20 }}>
                  {selectedBadge.description}
                </T>

                {!selectedBadge.earned && (
                  <View style={s.modalLockedTag}>
                    <T v="caption" color={C.textSub}>🔒 아직 획득하지 않은 배지입니다</T>
                  </View>
                )}

                <TouchableOpacity 
                  style={s.modalCloseBtn} 
                  activeOpacity={0.8}
                  onPress={() => setSelectedBadge(null)}
                >
                  <T v="green">닫기</T>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MissionHistory({ s, hist, C, weekGroups, weekLabels }) {
  const maxWeek = Math.max(0, weekLabels.length - 1);
  const [weekIdx, setWeekIdx] = useState(0);
  const items = weekGroups[weekIdx] ?? [];

  const catColor = (cat) => {
    if (cat === 'Energy')    return C.green;
    if (cat === 'Intellect') return C.purple;
    return C.blue;
  };

  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <T v="section" size={17}>미션 기록</T>
        <View style={s.weekNav}>
          <TouchableOpacity style={[s.navBtn, weekIdx >= maxWeek && s.navBtnDisabled]} onPress={() => setWeekIdx(i => Math.min(i + 1, maxWeek))} activeOpacity={0.7}>
            <Text style={s.navBtnText}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.navBtn, weekIdx === 0 && s.navBtnDisabled]} onPress={() => setWeekIdx(i => Math.max(i - 1, 0))} activeOpacity={0.7}>
            <Text style={s.navBtnText}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
      <T v="label" style={{ opacity: 0.7, marginBottom: 16 }}>{weekLabels[weekIdx] ?? ''}</T>
      {items.length === 0 && <View style={s.historyEmpty}><T v="sub" style={{ opacity: 0.5 }}>이 주에 완료한 미션이 없어요</T></View>}
      {items.map((item, i) => {
        const col = catColor(item.category);
        const isLast = i === items.length - 1;
        return (
          <View key={i} style={hist.row}>
            <View style={hist.dateCol}>
              <T v="caption">{item.fullDate}</T>
              <T v="caption" style={{ opacity: 0.6 }}>{item.time}</T>
            </View>
            <View style={hist.timelineCol}>
              <View style={[hist.dot, { backgroundColor: col }]} />
              {!isLast && <View style={hist.line} />}
            </View>
            <View style={hist.contentCol}>
              {item.photoUrl
                ? <Image source={{ uri: item.photoUrl }} style={hist.thumb} />
                : <LinearGradient colors={item.grad} style={hist.thumb}>
                    <Text style={hist.thumbIcon}>{item.icon}</Text>
                  </LinearGradient>
              }
              <T v="sub">{item.mission.length > 12 ? item.mission.slice(0,12)+'…' : item.mission}</T>
            </View>
            <View style={hist.statusCol}>
              {item.verified
                ? <View style={hist.verifiedTag}><T v="caption" color={C.green}>인증 완료</T></View>
                : <View style={hist.pendingTag}><T v="caption">대기 중</T></View>
              }
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function ProfileScreen() {
  const C = useColors();
  const { s, hist } = useMemo(() => makeAllStyles(C), [C]);
  const [badges, setBadges] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    api.get('/api/badges/me').then(setBadges).catch(e => console.warn('배지 로딩 실패:', e));
    api.get('/api/users/me').then(setUserProfile).catch(e => console.warn('프로필 로딩 실패:', e));
    Promise.all([
      api.get('/api/missions/history'),
      api.get('/api/users/me/stats'),
    ]).then(([hist, stats]) => {
      setHistoryItems(hist.map(toHistoryItem).filter(Boolean));
      setUserStats(stats);
    }).catch(e => console.warn('데이터 로딩 실패:', e));
  }, []);

  const STATS = userStats ? [
    { label: 'Energy',    color: C.green,  fill: userStats.energyFill,   level: userStats.energyLevel },
    { label: 'Intellect', color: C.purple, fill: userStats.intellectFill, level: userStats.intellectLevel },
    { label: 'Vitality',  color: C.blue,   fill: userStats.vitalityFill,  level: userStats.vitalityLevel },
  ] : [];
  const totalMissions = userStats?.totalMissions ?? 0;
  const verifiedCount = userStats?.totalVerified ?? 0;
  const streakDays    = userStats?.streak ?? 0;
  const weekData      = useMemo(() => computeWeekData(historyItems), [historyItems]);
  const { weekGroups, weekLabels } = useMemo(() => computeWeekGroups(historyItems), [historyItems]);
  const mainBadge  = useMemo(() => badges.find(b => b.earned) ?? null, [badges]);
  const headerGrad = C.isDark ? ['#111128', '#0d0d14'] : ['#f0f0fa', '#f3f3f8'];

  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <LinearGradient colors={headerGrad} style={s.profileHeader}>
        <View style={s.avatarSection}>
          <View style={s.avatarWrap}>
            <View style={s.avatarInner}>
              <View style={s.avatarHair} />
              <View style={s.avatarFace} />
              <View style={s.avatarBody} />
            </View>
            <View style={s.avatarRing} />
            <View style={s.levelBubble}><T v="caption" size={10} color="#000">Lv.{userProfile?.level ?? 1}</T></View>
          </View>
          <View style={s.nameBlock}>
            <T v="title" size={22}>{userProfile?.name ?? '...'}</T>
            {mainBadge && (
              <View style={s.titlePill}>
                <T v="purple" size={13}>👑 {mainBadge.name}</T>
              </View>
            )}
            <T v="label" style={{ opacity: 0.6 }}>{formatJoinDate(userProfile?.createdAt)}</T>
          </View>
        </View>
        <View style={s.summaryRow}>
          <View style={s.summaryItem}>
            <T v="stat" size={25}>{totalMissions}</T>
            <T v="sub">총 미션</T>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.summaryItem}>
            <T v="stat" size={25} color={C.green}>{streakDays}일</T>
            <T v="sub">연속 달성</T>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.summaryItem}>
            <T v="stat" size={25} color={C.purple}>{totalMissions > 0 ? Math.round(verifiedCount / totalMissions * 100) : 0}%</T>
            <T v="sub">인증 완료율</T>
          </View>
        </View>
      </LinearGradient>

      <View style={s.section}>
        <View style={s.sectionHeader}>
          <T v="section" size={17}>갓생 스탯</T>
          <SparkLine />
        </View>
        {STATS.map(st => <StatBar key={st.label} {...st} s={s} />)}
      </View>

      <WeeklyActivity s={s} C={C} weekData={weekData} />
      {badges.length > 0 && <BadgeGrid s={s} C={C} badges={badges} mainBadge={mainBadge} />}
      <MissionHistory s={s} hist={hist} C={C} weekGroups={weekGroups} weekLabels={weekLabels} />
    </ScrollView>
  );
}

function makeAllStyles(C) {
  const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.bg },
    profileHeader: { paddingVertical: 24, paddingHorizontal: 20, marginVertical: 12 },
    avatarSection: { flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 20 },
    avatarWrap:    { position: 'relative', width: 76, height: 76 },
    avatarInner:   { width: 76, height: 76, borderRadius: 38, backgroundColor: C.isDark ? '#1a1a2e' : '#e0e0f0', alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
    avatarHair:    { position: 'absolute', top: 8,  width: 42, height: 24, borderRadius: 12, backgroundColor: '#3a2010' },
    avatarFace:    { position: 'absolute', top: 18, width: 30, height: 30, borderRadius: 15, backgroundColor: '#c8956c' },
    avatarBody:    { width: 54, height: 26, borderRadius: 13, backgroundColor: C.isDark ? '#4a4a6a' : '#8888aa' },
    avatarRing:    { position: 'absolute', top: -3, left: -3, width: 82, height: 82, borderRadius: 41, borderWidth: 2, borderColor: C.greenBorder },
    levelBubble:   { position: 'absolute', bottom: -4, right: -4, backgroundColor: C.green, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 2, borderColor: C.bg },
    levelText:     { fontFamily: F, fontSize: 10, color: '#000' },
    nameBlock:     { flex: 1, gap: 5 },
    userName:      { fontFamily: F, fontSize: 22, color: C.text },
    titlePill:     { alignSelf: 'flex-start', backgroundColor: C.purpleFaint, borderWidth: 1, borderColor: C.purpleBorder, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    titlePillText: { fontFamily: F, fontSize: 12, color: C.purple },
    joinDate:      { fontFamily: F, fontSize: 11, color: C.textSub, opacity: 0.6 },
    summaryRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingVertical: 14 },
    summaryItem:    { flex: 1, alignItems: 'center', gap: 3 },
    summaryValue:   { fontFamily: F, fontSize: 22, color: C.text },
    summaryLabel:   { fontFamily: F, fontSize: 11, color: C.textSub },
    summaryDivider: { width: 1, height: 36, backgroundColor: C.border },
    section:        { marginHorizontal: 16, marginBottom: 12, backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
    sectionHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    sectionTitle:   { fontFamily: F, fontSize: 15, color: C.text },
    seeAll:         { fontFamily: F, fontSize: 12, color: C.green },
    statRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
    statLabel:      { fontFamily: F, fontSize: 13, color: C.textSub, width: 62 },
    statTrack:      { flex: 1, height: 6, backgroundColor: C.surface2, borderRadius: 3, overflow: 'hidden' },
    statFill:       { height: '100%', borderRadius: 3 },
    statLvBadge:    { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    statLv:         { fontFamily: F, fontSize: 11 },
    streakBadge:    { backgroundColor: 'rgba(255,107,53,0.15)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,107,53,0.3)', paddingHorizontal: 8, paddingVertical: 3 },
    streakText:     { fontFamily: F, fontSize: 12, color: '#ff6b35' },
    weekRow:        { flexDirection: 'row', justifyContent: 'space-between' },
    dayCol:         { alignItems: 'center', gap: 7 },
    dayBox:         { width: 36, height: 36, borderRadius: 10, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    dayBoxDone:     { backgroundColor: C.greenFaint, borderColor: C.greenBorder },
    dayCheck:       { fontFamily: F, fontSize: 14, color: C.green },
    dayLabel:       { fontFamily: F, fontSize: 11, color: C.textSub },
    titleTagRow:        { marginBottom: 14 },
    mainTitleTag:       { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: C.purpleBorder },
    mainTitleBadgeImg:  { width: 48, height: 48 },
    mainTitleName:      { fontFamily: F, fontSize: 15, color: C.text, marginBottom: 2 },
    mainTitleDesc:      { fontFamily: F, fontSize: 11, color: C.textSub },
    badgeGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    badgeCard:          { width: Math.floor((width - 32 - 32 - 16) / 3), backgroundColor: C.surface2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 8, alignItems: 'center', gap: 5 },
    badgeCardLocked:    { opacity: 0.6 },
    cardZoomIconWrap: { position: 'absolute', top: 6, right: 6, opacity: 0.6, zIndex: 1},
    cardZoomIcon: { width: 14, height: 14 },
    badgeImg:            { width: Math.floor((width - 32 - 32 - 16) / 3) - 16, height: 44 },
    badgeImgPlaceholder: { width: Math.floor((width - 32 - 32 - 16) / 3) - 16, height: 44, alignItems: 'center', justifyContent: 'center' },
    badgeName:          { fontFamily: F, fontSize: 11, color: C.text, textAlign: 'center' },
    badgeDesc:          { fontFamily: F, fontSize: 10, color: C.textSub, textAlign: 'center', lineHeight: 13, opacity: 0.7 },
    badgeLocked:        { fontFamily: F, fontSize: 9, color: C.textSub, opacity: 0.5 },
    weekNav:        { flexDirection: 'row', gap: 4 },
    navBtn:         { width: 28, height: 28, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    navBtnDisabled: { opacity: 0.3 },
    navBtnText:     { fontSize: 20, color: C.text },
    weekLabel:      { fontFamily: F, fontSize: 12, color: C.textSub, marginBottom: 16, opacity: 0.7 },
    historyEmpty:   { alignItems: 'center', paddingVertical: 24 },
    historyEmptyText: { fontFamily: F, fontSize: 13, color: C.textSub, opacity: 0.5 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: C.surface, borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: C.border },
    modalBadgeImg: { width: 160, height: 160, marginBottom: 10 },
    modalBadgeImgPlaceholder: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface2, borderRadius: 80, marginBottom: 10 },
    modalLockedTag: { backgroundColor: C.surface2, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginBottom: 20 },
    modalCloseBtn: { width: '100%', paddingVertical: 14, borderRadius: 14, backgroundColor: C.greenFaint, borderWidth: 1, borderColor: C.greenBorder, alignItems: 'center' },
    zoomHintContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, opacity: 0.7 },
    zoomHintIcon: { width: 16, height: 16 },
  });

  const hist = StyleSheet.create({
    row:         { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0, minHeight: 120 },
    dateCol:     { width: 88, paddingTop: 10, flexShrink: 0 },
    dateText:    { fontFamily: F, fontSize: 11, color: C.textSub, lineHeight: 16 },
    timeText:    { fontFamily: F, fontSize: 11, color: C.textSub, opacity: 0.6 },
    timelineCol: { width: 18, alignItems: 'center', flexShrink: 0 },
    dot:         { width: 12, height: 12, borderRadius: 6, marginTop: 10, borderWidth: 2, borderColor: C.bg },
    line:        { flex: 1, width: 2, backgroundColor: C.border, marginTop: 4, minHeight: 80 },
    contentCol:  { flex: 1, paddingTop: 4, paddingLeft: 8, paddingBottom: 16 },
    thumb:       { width: '100%', height: 110, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    thumbIcon:   { fontSize: 40 },
    missionLabel: { fontFamily: F, fontSize: 13, color: C.textSub },
    statusCol:   { paddingTop: 10, paddingLeft: 8, flexShrink: 0, alignItems: 'flex-end' },
    verifiedTag: { backgroundColor: C.greenFaint, borderWidth: 1, borderColor: C.greenBorder, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
    verifiedText: { fontFamily: F, fontSize: 11, color: C.green },
    pendingTag:  { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
    pendingText: { fontFamily: F, fontSize: 11, color: C.textSub },
  });

  return { s, hist };
}
