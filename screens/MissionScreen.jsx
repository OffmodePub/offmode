import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Animated, Easing, Image,
} from 'react-native';
import { BASE_URL } from '../utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../utils/useColors';
import { api } from '../utils/api';
import T from '../components/ThemedText';
import Svg, { Path, Defs, ClipPath, Rect } from 'react-native-svg';

const F = 'Kkukkukk';

function HourglassAnimation({ size = 88 }) {
  const C = useColors();
  const col = C.green;

  const [fill, setFill] = useState(0);
  const rotation = useRef(new Animated.Value(0)).current;
  const rafRef   = useRef(null);
  const startRef = useRef(Date.now());
  const FILL_MS  = 3200;

  useEffect(() => {
    const tick = () => {
      const progress = Math.min((Date.now() - startRef.current) / FILL_MS, 1);
      setFill(progress);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        Animated.timing(rotation, {
          toValue: 1, duration: 700, useNativeDriver: true,
        }).start(() => {
          rotation.setValue(0);
          setFill(0);
          startRef.current = Date.now();
          rafRef.current = requestAnimationFrame(tick);
        });
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const rotate = rotation.interpolate({
    inputRange: [0, 1], outputRange: ['0deg', '180deg'],
  });

  // ── 기하학 ─────────────────────────────────────
  const S   = size;
  const cx  = S / 2;
  const px  = S * 0.12;             // 좌우 여백
  const ty  = S * 0.07;             // 최상단
  const by  = S - ty;               // 최하단
  const ch  = S * 0.09;             // 상하 캡 높이
  const bty = ty + ch;              // 몸통 상단 (캡 아래)
  const bby = by - ch;              // 몸통 하단 (캡 위)
  const nk  = S * 0.04;             // 목 반폭
  const nty = S / 2 - S * 0.06;    // 목 상단
  const nby = S / 2 + S * 0.06;    // 목 하단

  // 모래시계 전체 윤곽 (상하 캡 + 곡선 측면)
  const hgPath =
    `M ${px},${ty} L ${S-px},${ty} L ${S-px},${bty} ` +
    `Q ${S-px},${nty} ${cx+nk},${nty} L ${cx+nk},${nby} ` +
    `Q ${S-px},${nby} ${S-px},${bby} L ${S-px},${by} ` +
    `L ${px},${by} L ${px},${bby} ` +
    `Q ${px},${nby} ${cx-nk},${nby} L ${cx-nk},${nty} ` +
    `Q ${px},${nty} ${px},${bty} Z`;

  // 모래 수위 (클립 패스로 정확히 잘림)
  const tsY = bty + fill * (nty - bty);       // 위쪽 모래 표면 (아래로 내려감)
  const bsY = bby - fill * (bby - nby);       // 아래쪽 모래 표면 (위로 올라감)
  const streaming = fill > 0.03 && fill < 0.97;

  return (
    <View style={{
      marginBottom: 12,
      shadowColor: col,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: C.isDark ? 0.5 : 0.2,
      shadowRadius: 18,
    }}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
          <Defs>
            <ClipPath id="hgc">
              <Path d={hgPath} />
            </ClipPath>
          </Defs>

          {/* 유리 틴트 */}
          <Path d={hgPath} fill={col} fillOpacity={0.06} />

          {/* 위쪽 모래 */}
          {fill < 0.99 && (
            <Rect
              x={0} y={tsY} width={S} height={Math.max(nty - tsY, 0)}
              fill={col} fillOpacity={0.42} clipPath="url(#hgc)"
            />
          )}
          {/* 위쪽 모래 표면 하이라이트 */}
          {fill < 0.95 && (
            <Rect
              x={0} y={tsY} width={S} height={2}
              fill={col} fillOpacity={0.8} clipPath="url(#hgc)"
            />
          )}

          {/* 아래쪽 모래 */}
          {fill > 0.01 && (
            <Rect
              x={0} y={bsY} width={S} height={Math.max(bby - bsY, 0)}
              fill={col} fillOpacity={0.62} clipPath="url(#hgc)"
            />
          )}
          {/* 아래쪽 모래 표면 하이라이트 */}
          {fill > 0.05 && (
            <Rect
              x={0} y={bsY} width={S} height={2}
              fill={col} fillOpacity={0.95} clipPath="url(#hgc)"
            />
          )}

          {/* 모래 낙하 스트림 */}
          {streaming && (
            <Path
              d={`M ${cx},${nty + 2} L ${cx},${nby - 2}`}
              stroke={col} strokeWidth={2.5} strokeOpacity={0.55}
              strokeLinecap="round"
            />
          )}

          {/* 유리 윤곽선 */}
          <Path
            d={hgPath} fill="none"
            stroke={col} strokeWidth={2} strokeOpacity={0.8}
            strokeLinejoin="round" strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const BADGE_IMAGES = {
  'badge_explore_lv01_initiate.png':        require('../assets/badge/badge_explore_lv01_initiate.png'),
  'badge_explore_lv02_explorer.png':        require('../assets/badge/badge_explore_lv02_explorer.png'),
  'badge_real_world_ruler.png':             require('../assets/badge/badge_real_world_ruler.png'),
  'badge_activity_walker_walker.png':       require('../assets/badge/badge_activity_walker_walker.png'),
  'badge_activity_beauty_curator.png':      require('../assets/badge/badge_activity_beauty_curator.png'),
  'badge_activity_local_hipster.png':       require('../assets/badge/badge_activity_local_hipster.png'),
  'badge_time_dawn_dawnmaster.png':         require('../assets/badge/badge_time_dawn_dawnmaster.png'),
  'badge_time_afternoon_freeman.png':       require('../assets/badge/badge_time_afternoon_freeman.png'),
  'badge_time_evening_timewarden.png':      require('../assets/badge/badge_time_evening_timewarden.png'),
  'badge_unique_speedrunner_streakking.png':require('../assets/badge/badge_unique_speedrunner_streakking.png'),
  'badge_activity_routine_manager.png':    require('../assets/badge/badge_activity_routine_manager.png'),
};

const TICKER_MESSAGES = [
  '📸  사진으로 인증하기', '✨  하루 하나의 미션', '🔥  오늘도 갓생 도전',
  '⚡️  미션 완료하고 배지 획득', '🌙  스마트폰 내려놓는 시간',
  '👑  새벽의 지배자가 되어라', '📍  오프라인에서 진짜 삶을', '🎯  지금 바로 시작하기',
];
const TICKER_TEXT = TICKER_MESSAGES.join('          ') + '          ';

function MarqueeBanner() {
  const C = useColors();
  const translateX = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState(0);

  useEffect(() => {
    if (textWidth > 0) {
      translateX.setValue(0);
      Animated.loop(
        Animated.timing(translateX, {
          toValue: -(textWidth + 1), duration: (textWidth + 1) * 30,
          easing: Easing.linear, useNativeDriver: true, isInteraction: false,
        })
      ).start();
    }
  }, [textWidth, translateX]);

  return (
    <View>
      {/* horizontal ScrollView 안에서는 Text가 줄바꿈 없이 자연 너비로 측정됨 */}
      <ScrollView
        horizontal scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ position: 'absolute', opacity: 0 }}
        pointerEvents="none"
      >
        <T
          v="body"
          style={{ paddingVertical: 8, letterSpacing: 0.4 }}
          onLayout={(e) => { if (e.nativeEvent.layout.width > 0) setTextWidth(e.nativeEvent.layout.width); }}
        >
          {TICKER_TEXT}
        </T>
      </ScrollView>

      <View style={{
        backgroundColor: C.isDark ? '#0a1a10' : '#f0f8f4',
        borderTopWidth: 1, borderBottomWidth: 1,
        borderColor: C.isDark ? '#22c97a88' : C.greenBorder,
        overflow: 'hidden', height: 44, justifyContent: 'center',
        ...(C.isDark && { shadowColor: '#22c97a', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }),
      }}>
        <Animated.View style={{ flexDirection: 'row', transform: [{ translateX }] }}>
          {textWidth > 0 && <T v="green" style={{ paddingVertical: 8, width: textWidth + 1, letterSpacing: 0.6, opacity: C.isDark ? 1 : 0.85 }}>{TICKER_TEXT}</T>}
          {textWidth > 0 && <T v="green" style={{ paddingVertical: 8, width: textWidth + 1, letterSpacing: 0.6, opacity: C.isDark ? 1 : 0.85 }}>{TICKER_TEXT}</T>}
        </Animated.View>
      </View>
    </View>
  );
}

function StatBar({ label, color, fill, styles }) {
  return (
    <View style={styles.statRow}>
      <T v="sub" style={{ width: 62 }}>{label}</T>
      <View style={styles.statTrack}>
        <View style={[styles.statFill, { width: `${fill}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function MissionIcon({ icon, styles, C }) {
  if (icon) {
    return (
      <View style={styles.iconBox}>
        <Text style={{ fontSize: 38 }}>{icon}</Text>
      </View>
    );
  }
  return (
    <View style={styles.iconBox}>
      <View style={styles.iconWindow}>
        <View style={styles.iconWindowBar} />
        <View style={styles.iconPanes}>
          <View style={styles.iconPane}>
            <View style={styles.cloud}>
              <View style={styles.cloudBody} />
              <View style={[styles.cloudPuff, { left: -6, width: 12, height: 12 }]} />
              <View style={[styles.cloudPuff, { right: -6, width: 12, height: 12 }]} />
            </View>
          </View>
          <View style={[styles.iconPane, { borderLeftWidth: 1, borderLeftColor: C.greenBorder }]} />
        </View>
      </View>
    </View>
  );
}

function MissionCard({ currentMission, userStats, mainBadge, earnedBadges, displayedText, onOpenVerify, styles, C, refreshing, onRefresh }) {
  const cat       = currentMission?.category;
  const catColor  = cat === 'Intellect' ? C.purple  : cat === 'Energy' ? C.blue   : C.green;
  const catFaint  = cat === 'Intellect' ? C.purpleFaint  : cat === 'Energy' ? C.blueFaint  : C.greenFaint;
  const catBorder = cat === 'Intellect' ? C.purpleBorder : cat === 'Energy' ? C.blueBorder : C.greenBorder;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} /> : undefined}
    >
      <View style={styles.cardWrapper}>
        <View style={[styles.card, { borderColor: catBorder }]}>
          <LinearGradient
            colors={[catColor + '28', 'transparent']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 70, borderRadius: 20 }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <T v="section" color={catColor} style={{ letterSpacing: 2, opacity: 0.85 }}>오늘의 미션</T>
            {cat && (
              <View style={{ backgroundColor: catFaint, borderWidth: 1, borderColor: catBorder, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                <T v="label" color={catColor}>{cat}</T>
              </View>
            )}
          </View>
          <MissionIcon icon={currentMission?.icon} styles={styles} C={C} />
          <T v="mission" style={{ marginBottom: 10 }}>{currentMission?.text ?? '창문 열고\n하늘 사진 찍기'}</T>
          <View style={styles.statusRow}>
            <Text style={styles.statusClock}>
              {currentMission?.status === 'verified' ? '✅' : currentMission?.photoUrl ? '⏳' : '🕐'}
            </Text>
            <T v="green16" style={{ opacity: 0.8 }}>
              {currentMission?.status === 'verified'
                ? '인증 완료!'
                : currentMission?.photoUrl
                  ? '인증 대기 중...'
                  : displayedText}
            </T>
          </View>
          <View style={styles.statsBlock}>
            <StatBar label="Vitality"  color={C.green}  fill={userStats?.vitalityFill  ?? 0} styles={styles} />
            <StatBar label="Intellect" color={C.purple} fill={userStats?.intellectFill ?? 0} styles={styles} />
            <StatBar label="Energy"    color={C.blue}   fill={userStats?.energyFill    ?? 0} styles={styles} />
          </View>
          {(mainBadge || earnedBadges.length > 0) && (
            <View style={styles.badgeRow}>
              {mainBadge && (
                <View style={styles.titleTag}>
                  <T v="purple" size={14} style={{ letterSpacing: 0.3 }}>{mainBadge.name}</T>
                </View>
              )}
              <View style={styles.badges}>
                {earnedBadges.map((b, i) => {
                  const colors = [
                    { border: C.purpleBorder, bg: C.purpleFaint },
                    { border: C.blueBorder,   bg: C.blueFaint   },
                    { border: C.greenBorder,  bg: C.greenFaint  },
                  ][i % 3];
                  const badgeImg = b.imageFile ? BADGE_IMAGES[b.imageFile] : null;
                  return (
                    <View key={b.key ?? i} style={[styles.badge, { borderColor: colors.border, backgroundColor: colors.bg }]}>
                      {badgeImg
                        ? <Image source={badgeImg} style={styles.badgeImg} resizeMode="contain" />
                        : <Text style={styles.badgeEmoji}>🏅</Text>
                      }
                    </View>
                  );
                })}
              </View>
            </View>
          )}
          {currentMission?.photoUrl || currentMission?.status === 'verified' ? (
            <View style={styles.verifiedResult}>
              {currentMission.photoUrl ? (
                <Image
                  source={{ uri: currentMission.photoUrl.startsWith('/')
                    ? `${BASE_URL}${currentMission.photoUrl}`
                    : currentMission.photoUrl }}
                  style={styles.verifiedPhoto}
                  resizeMode="cover"
                />
              ) : null}
              <View style={styles.verifiedInfo}>
                <View style={styles.verifiedTag}>
                  {currentMission.status === 'verified'
                    ? <T v="green" size={13}>✅  인증 완료</T>
                    : <T v="sub" size={13}>⏳  다른 사람의 인증을 기다리는 중</T>
                  }
                </View>
                {currentMission.caption
                  ? <T v="sub" style={{ marginTop: 6 }}>{currentMission.caption}</T>
                  : null}
                <T v="caption" style={{ marginTop: 6, opacity: 0.55 }}>
                  {currentMission.status === 'verified'
                    ? '피드에서 리액션을 확인해봐요 🎉'
                    : '같은 미션을 받은 사람이 인증해주면 완료돼요'}
                </T>
              </View>
            </View>
          ) : (
            <TouchableOpacity activeOpacity={0.8} onPress={onOpenVerify}>
              <LinearGradient colors={['#26d67a', '#1ab065']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.verifyBtn}>
                <T v="btn" size={17} style={{ letterSpacing: 0.5 }}>인증하기</T>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const STEPS = [
  { icon: '🕐', title: '시간 설정',   desc: '미션을 받고 싶은 시간을 정해요' },
  { icon: '📋', title: '미션 도착',   desc: '매일 딱 하나의 미션이 팡!' },
  { icon: '📸', title: '인증 & 공유', desc: '완료하고 인증 카드로 자랑하기' },
];

function WaitingTitle() {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setDots(d => (d + 1) % 4), 520);
    return () => clearInterval(id);
  }, []);

  const dotStr = '.'.repeat(dots).padEnd(3, ' ');

  return (
    <View style={{ marginTop: 6, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
      <T v="title" size={25}>미션 대기 중 </T>
      <T v="green" size={25}>{dotStr}</T>
    </View>
  );
}

function useCountdown(missionTime) {
  const calc = () => {
    const now = new Date();
    const target = new Date();
    target.setHours(missionTime.hour, missionTime.minute, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const diff = Math.floor((target - now) / 1000);
    return { h: Math.floor(diff / 3600), m: Math.floor((diff % 3600) / 60), s: diff % 60 };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [missionTime]);
  return time;
}

function EmptyMissionState({ missionTime, onOpenTimeSettings, onOpenRoulette, communityStats, userStats, missionPool, refreshing, onRefresh }) {
  const C = useColors();
  const { styles, empty } = useMemo(() => makeAllStyles(C), [C]);
  const pad = (n) => String(n).padStart(2, '0');
  const { h, m, s } = useCountdown(missionTime || { hour: 8, minute: 0 });
  const timeLabel = missionTime ? `${pad(missionTime.hour)}:${pad(missionTime.minute)}` : '08:00';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} /> : undefined}
    >
      <View style={empty.waitCard}>
        <HourglassAnimation size={88} />
        <WaitingTitle />
        <T v="sub" style={{ fontSize: 16,textAlign: 'center', lineHeight: 24, marginBottom: 24 }}>매일 설정한 시간에{'\n'}오늘의 미션이 도착해요</T>
        <View style={empty.countdownRow}>
          {[{ v: h, u: '시간' }, { v: m, u: '분' }, { v: s, u: '초' }].map(({ v, u }, i) => (
            <React.Fragment key={u}>
              {i > 0 && <T v="sub" size={24} style={{ opacity: 0.4, marginBottom: 14 }}>:</T>}
              <View style={empty.countdownBlock}>
                <T v="stat">{pad(v)}</T>
                <T v="caption" style={{ marginTop: 2 }}>{u}</T>
              </View>
            </React.Fragment>
          ))}
        </View>
        <TouchableOpacity style={empty.timeRow} onPress={onOpenTimeSettings} activeOpacity={0.7}>
          <T v="sub" style={{ fontSize: 16 }}>🕐  미션 알림 시간</T>
          <T v="green" style={{ fontSize: 16 }}>{timeLabel}  ›</T>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onOpenRoulette} activeOpacity={0.85} style={{ marginHorizontal: 20, marginTop: 14 }}>
        <LinearGradient colors={['#26d67a', '#1ab065']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={empty.rollBtn}>
          <Text style={empty.rollBtnIcon}>🎰</Text>
          <T v="btn" size={17}>미션 돌리기</T>
        </LinearGradient>
      </TouchableOpacity>

      <T v="section" style={{ paddingHorizontal: 20, marginTop: 28, marginBottom: 20, fontSize: 16 }}>이렇게 하면 돼요</T>
      <View style={empty.stepsWrap}>
        {STEPS.map((step, i) => (
          <View key={i} style={empty.stepRow}>
            <View style={empty.stepNumWrap}>
              <Text style={empty.stepEmoji}>{step.icon}</Text>
              {i < STEPS.length - 1 && <View style={empty.stepLine} />}
            </View>
            <View style={empty.stepContent}>
              <T v="section" style={{ marginBottom: 4, marginTop: 2, fontSize: 16 }}>{step.title}</T>
              <T v="sub" style={{ lineHeight: 19, fontSize: 14 }}>{step.desc}</T>
            </View>
          </View>
        ))}
      </View>

      <T v="section" style={{ paddingHorizontal: 20, marginTop: 28, marginBottom: 20, fontSize: 16 }}>지금 이 순간</T>
      <View style={empty.statsRow}>
        {[
          { value: communityStats ? communityStats.activeToday.toLocaleString() : '-', label: '오늘 미션 중' },
          { value: communityStats ? `${communityStats.verificationRate}%` : '-',       label: '인증 완료율' },
          { value: userStats ? `${userStats.streak}일` : '-',                          label: '나의 연속 기록' },
        ].map((st, i) => (
          <View key={i} style={[empty.statCard, i === 1 && { borderColor: C.greenBorder, backgroundColor: C.greenFaint }]}>
            <T v="title" size={20} style={{ marginBottom: 6 }} color={i === 1 ? C.green : undefined}>{st.value}</T>
            <T v="caption" style={{ textAlign: 'center', fontSize: 14 }}>{st.label}</T>
          </View>
        ))}
      </View>

      {missionPool.length > 0 && (
        <View style={empty.hintCard}>
          <T v="body" style={{ marginBottom: 14, fontSize: 16 }}>미션은 이런 거예요</T>
          {missionPool.slice(0, 4).map((m, i) => (
            <View key={i} style={empty.hintRow}>
              <View style={empty.hintDot} />
              <T v="sub" style={{ fontSize: 15 }}>{m.icon}  {m.text}</T>
            </View>
          ))}
          <T v="sub" style={{ opacity: 0.6, marginTop: 6, fontSize: 14 }}>* 매일 랜덤으로 새 미션이 도착해요</T>
        </View>
      )}
    </ScrollView>
  );
}

export default function MissionScreen({ missionTime, onOpenTimeSettings, onOpenRoulette, onOpenVerify, hasMission = false, currentMission, onRefresh }) {
  const C = useColors();
  const { styles } = useMemo(() => makeAllStyles(C), [C]);
  const pad = (n) => String(n).padStart(2, '0');
  const timeLabel = missionTime ? `${pad(missionTime.hour)}:${pad(missionTime.minute)}` : '08:00';

  const [displayedText,  setDisplayedText]  = useState('');
  const [communityStats, setCommunityStats] = useState(null);
  const [userStats,      setUserStats]      = useState(null);
  const [badges,         setBadges]         = useState([]);
  const [missionPool,    setMissionPool]    = useState([]);
  const [refreshing,     setRefreshing]     = useState(false);
  const fullText = "미션 수행 중...";

  const loadData = useCallback(async () => {
    await Promise.all([
      api.get('/api/v1/feed/stats').then(setCommunityStats).catch(e => console.warn('커뮤니티 통계 로딩 실패:', e)),
      api.get('/api/v1/users/me/stats').then(setUserStats).catch(e => console.warn('유저 통계 로딩 실패:', e)),
      api.get('/api/v1/badges/me').then(setBadges).catch(e => console.warn('배지 로딩 실패:', e)),
      api.get('/api/v1/missions/pool').then(setMissionPool).catch(e => console.warn('미션 풀 로딩 실패:', e)),
    ]);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadData(), onRefresh?.()]);
    setRefreshing(false);
  }, [loadData, onRefresh]);

  const mainBadge    = badges.find(b => b.earned) ?? null;
  const earnedBadges = badges.filter(b => b.earned).slice(0, 3);

  useEffect(() => {
    if (!hasMission) return;

    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(fullText.slice(0, index + 1));
      index++;

      if (index > fullText.length) {
        index = 0;
        setDisplayedText('');
      }
    }, 250);

    return () => clearInterval(interval);
  }, [hasMission]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <T v="logo">OFFMODE</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {userStats?.streak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={{ fontSize: 13 }}>🔥</Text>
                <T v="green" style={{ letterSpacing: 0.3 }}>{userStats.streak}일 연속</T>
              </View>
            )}
            <TouchableOpacity style={styles.timeBtn} onPress={onOpenTimeSettings} activeOpacity={0.7}>
              <Text style={styles.timeBtnIcon}>🕐</Text>
              <T v="green" style={{ letterSpacing: 0.5 }}>{timeLabel}</T>
            </TouchableOpacity>
          </View>
        </View>
        <T v="section" style={{ lineHeight: 20, fontSize: 17 }}>스크린 OFF. 일상 ON.</T>
      </View>

      <MarqueeBanner />

      {hasMission ? (
        <MissionCard
          currentMission={currentMission}
          userStats={userStats}
          mainBadge={mainBadge}
          earnedBadges={earnedBadges}
          displayedText={displayedText}
          onOpenVerify={onOpenVerify}
          styles={styles}
          C={C}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      ) : (
        <EmptyMissionState
          missionTime={missionTime}
          onOpenTimeSettings={onOpenTimeSettings}
          onOpenRoulette={onOpenRoulette}
          communityStats={communityStats}
          userStats={userStats}
          missionPool={missionPool}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
}

function makeAllStyles(C) {
  const styles = StyleSheet.create({
    screen:  { flex: 1, backgroundColor: C.bg },
    content: { paddingBottom: 130 },
    header:  { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 16 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    timeBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.surface, borderWidth: 1, borderColor: C.greenBorder, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
    streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.greenFaint, borderWidth: 1, borderColor: C.greenBorder, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
    timeBtnIcon: { fontSize: 14 },
    cardWrapper: { paddingHorizontal: 20, marginTop: 25 },
    card:        { backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.greenBorder, borderRadius: 20, padding: 20 },
    iconBox:     { alignSelf: 'center', marginBottom: 16, width: 80, height: 80, borderRadius: 18, backgroundColor: C.greenFaint, borderWidth: 1, borderColor: C.greenBorder, alignItems: 'center', justifyContent: 'center' },
    iconWindow:  { width: 46, height: 40, borderWidth: 1.5, borderColor: C.green, borderRadius: 4, overflow: 'hidden' },
    iconWindowBar: { height: 11, borderBottomWidth: 1.5, borderBottomColor: C.green, backgroundColor: 'transparent' },
    iconPanes:   { flex: 1, flexDirection: 'row' },
    iconPane:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
    cloud:       { alignItems: 'center' },
    cloudBody:   { width: 18, height: 8, backgroundColor: C.green, borderRadius: 4, opacity: 0.85 },
    cloudPuff:   { position: 'absolute', top: -4, backgroundColor: C.green, borderRadius: 6, opacity: 0.85 },
    statusRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 20 },
    statusClock: { fontSize: 15 },
    statsBlock:  { marginBottom: 14 },
    statRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 9, gap: 8 },
    statTrack:   { flex: 1, height: 6, backgroundColor: C.surface2, borderRadius: 3, overflow: 'hidden' },
    statFill:    { height: '100%', borderRadius: 3 },
    badgeRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
    titleTag:    { backgroundColor: C.purpleFaint, borderWidth: 1, borderColor: C.purpleBorder, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
    badges:      { flexDirection: 'row', gap: 6 },
    badge:       { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    badgeImg:    { width: 26, height: 26 },
    badgeEmoji:  { fontSize: 16 },
    verifyBtn:   { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    verifiedResult: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.greenBorder, backgroundColor: C.greenFaint },
    verifiedPhoto:  { width: '100%', height: 160 },
    verifiedInfo:   { padding: 14 },
    verifiedTag:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  });

  const empty = StyleSheet.create({
    waitCard: { marginHorizontal: 20, marginTop: 16, backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 24, alignItems: 'center' },
    countdownRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
    countdownBlock: { alignItems: 'center', backgroundColor: C.surface2, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, minWidth: 64, borderWidth: 1, borderColor: C.border },
    timeRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', backgroundColor: C.greenFaint, borderWidth: 1, borderColor: C.greenBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16 },
    stepsWrap:    { marginHorizontal: 20, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 20 },
    stepRow:      { flexDirection: 'row', gap: 14, minHeight: 60 },
    stepNumWrap:  { alignItems: 'center', width: 36 },
    stepEmoji:    { fontSize: 28 },
    stepLine:     { flex: 1, width: 1.5, backgroundColor: C.border, marginTop: 6, marginBottom: -10 },
    stepContent:  { flex: 1, paddingBottom: 21 },
    statsRow:     { flexDirection: 'row', marginHorizontal: 20, gap: 8 },
    statCard:     { flex: 1, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, alignItems: 'center' },
    hintCard:     { marginHorizontal: 20, marginTop: 16, marginBottom: 8, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 20 },
    hintRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    hintDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green, opacity: 0.6 },
    rollBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 16, paddingVertical: 17 },
    rollBtnIcon:  { fontSize: 22 },
  });

  return { styles, empty };
}
