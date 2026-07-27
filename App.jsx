import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, Animated, LogBox, Platform, PanResponder, Linking } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import PageIndicator from './components/PageIndicator';
import useBottomInset from './utils/useBottomInset';
import { W } from './constants/warm';
import * as SecureStore from 'expo-secure-store';
import * as H from './utils/haptics';
import * as A from './utils/analytics';
import * as S from './utils/sounds';
import { parseInviteCode } from './utils/invite';
import RoomListScreen from './screens/RoomListScreen';
import RoomDetailScreen from './screens/RoomDetailScreen';
import CreateRoomScreen from './screens/CreateRoomScreen';
import JoinRoomScreen from './screens/JoinRoomScreen';
import MissionPickerScreen from './screens/MissionPickerScreen';
import RoomSettingsScreen from './screens/RoomSettingsScreen';
import RoomVerifyScreen from './screens/RoomVerifyScreen';
import ProofDetailScreen from './screens/ProofDetailScreen';
import RoomCompleteScreen from './screens/RoomCompleteScreen';
import RoomHistoryScreen from './screens/RoomHistoryScreen';
import MyHistoryScreen from './screens/MyHistoryScreen';
import ProfileScreen from './screens/ProfileScreen';
import MissionTimeScreen from './screens/MissionTimeScreen';
import MissionRouletteScreen from './screens/MissionRouletteScreen';
import VerifyScreen from './screens/VerifyScreen';
import SettingsScreen from './screens/SettingsScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import BlockedUsersScreen from './screens/BlockedUsersScreen';
import { ThemeProvider, useTheme } from './utils/ThemeContext';

// [WORKAROUND] RN 0.83 iOS Release 빌드에서 RCTFatal abort로 escalate되는
// 알려진 native bridge 노이즈 에러들을 silent suppress.
// - RCTEventEmitter 조기 emit: React renderer 등록 이전의 cosmetic view event
// - Promise 이중 처리: 카카오/Apple SDK의 known race condition (try/catch로 첫 reject는 처리됨)
// dev/Android에서는 진짜 에러도 가려지지 않도록 iOS Release에만 적용.
if (!__DEV__ && Platform.OS === 'ios') {
  LogBox.ignoreLogs([
    /Module has not been registered as callable/,
    /RCTEventEmitter\.receiveEvent/,
    /Tried to reject a promise after it'?s already been resolved/,
    /Tried to resolve a promise after it'?s already been resolved/,
  ]);
  if (global.ErrorUtils) {
    const originalHandler = global.ErrorUtils.getGlobalHandler();
    global.ErrorUtils.setGlobalHandler((error, isFatal) => {
      const msg = String(error?.message || error || '');
      const isNoiseError =
        (msg.includes('RCTEventEmitter') && msg.includes('not been registered as callable')) ||
        msg.includes('Tried to reject a promise after') ||
        msg.includes('Tried to resolve a promise after') ||
        msg.includes('already been resolved');
      if (isNoiseError) {
        console.warn('[RN0.83 workaround] suppressed bridge noise:', msg.slice(0, 200));
        return;
      }
      originalHandler?.(error, isFatal);
    });
  }
}
import { api } from './utils/api';
import { scheduleMissionNotification, registerPushToken } from './utils/notifications';
import useAuth from './utils/useAuth';
import useMissionRouletteTrigger from './utils/useMissionRouletteTrigger';

SplashScreen.preventAutoHideAsync().catch(() => {});

// 최상위 4페이지 좌우 스와이프 순서 (records 맨 왼쪽). Feed 탭은 RoomDetail로 흡수되어 제거됨.
const PAGES = ['records', 'profile', 'mission', 'settings'];

// 최상위 페이저 하단 여백 (홈 인디케이터 있으면 그 높이, 없으면 24px — useBottomInset).
// SafeAreaProvider 하위에서 렌더돼야 훅이 동작하므로 별도 컴포넌트로 분리.
function PagerBottomInset() {
  const height = useBottomInset();
  return <View style={{ height, backgroundColor: 'transparent' }} />;
}

function AppInner() {
  const { colors: C, scheme } = useTheme();

  const [tab, setTab]                           = useState('mission');
  const [stack, setStack]                       = useState([]);
  const [missionTime, setMissionTime]           = useState({ hour: 8, minute: 0 });
  const [hasMission, setHasMission]             = useState(false);
  const [currentMission, setCurrentMission]     = useState(null);
  const [currentMissionId, setCurrentMissionId] = useState(null);
  const [showRoulette, setShowRoulette]         = useState(false);
  const [showOnboarding, setShowOnboarding]     = useState(false);
  const [autoRoulette, setAutoRoulette]         = useState(true);
  const [profile, setProfile]                   = useState({ name: '오프모더', avatar: '01' });
  const [roomVersion, setRoomVersion]           = useState(0);
  const [pendingInvite, setPendingInvite]       = useState(null); // 딥링크로 들어온 초대코드 (인증 후 처리)
  const celebratedRoomsRef = useRef(new Set());

  // 방 데이터 변경(생성/참여/나가기/미션/인증) 후 목록·상세 새로고침 트리거
  const bumpRoom = () => setRoomVersion(v => v + 1);
  // 방 전원 인증 완료 축하 — 미션 id 기준 1회만
  const handleRoomComplete = (summary, key) => {
    if (key == null) return;
    if (celebratedRoomsRef.current.has(key)) return;
    celebratedRoomsRef.current.add(key);
    push('roomComplete', { summary });
  };

  const loadTodayMission = async () => {
    try {
      const mission = await api.get('/api/v1/missions/today');
      if (mission) {
        setCurrentMission({ icon: mission.missionIcon, text: mission.missionText, category: mission.missionCategory, status: mission.status, photoUrl: mission.photoUrl, caption: mission.caption });
        setCurrentMissionId(mission.id);
        setHasMission(true);
      }
    } catch (e) {
      // 204 No Content = 오늘 미션 없음, 정상
    }
  };

  // 로그인/자동 로그인 성공 시 공통 후처리 — 프로필·미션시간·오늘미션·알림 예약
  const applySession = async (user) => {
    setProfile({ name: user.name ?? '오프모더', avatar: user.avatar ?? '01' });
    const hour   = user.missionHour   ?? 8;
    const minute = user.missionMinute ?? 0;
    if (user.missionHour != null) setMissionTime({ hour, minute });
    if (user.autoRoulette != null) setAutoRoulette(user.autoRoulette);
    await loadTodayMission();
    scheduleMissionNotification(hour, minute);
    registerPushToken();   // 원격 푸시(콕 찌르기) 수신용 — 실패해도 세션에는 영향 없음
  };

  // 로그아웃 시 세션 상태 초기화
  const resetSession = () => {
    A.resetAnalyticsState();
    setProfile({ name: '오프모더', avatar: '01' });
    setMissionTime({ hour: 8, minute: 0 });
    setHasMission(false);
    setCurrentMission(null);
    setCurrentMissionId(null);
  };

  // ── 인증 상태: 'loading' | 'unauthenticated' | 'signingUp' | 'authenticated'
  const {
    authStatus, setAuthStatus, authUser, authProvider, loginLoading, loginError,
    handleKakaoLogin, handleAppleLogin, handleLogout, handleDeleteAccount,
  } = useAuth({ applySession, resetSession });

  const handleSignupComplete = async (profileData) => {
    const { name, avatar, missionTime: mt } = profileData;
    try {
      await api.put('/api/v1/users/me', {
        name,
        avatar,
        missionHour:   mt.hour,
        missionMinute: mt.minute,
      });
    } catch (e) {
      console.warn('프로필 저장 실패:', e);
    }
    setProfile({ name, avatar });
    setMissionTime(mt);
    await loadTodayMission();
    scheduleMissionNotification(mt.hour, mt.minute);
    registerPushToken();
    A.logRegistration(authProvider);   // Meta 광고 — 가입 완료 이벤트
    setShowOnboarding(true);   // 신규 유저: 인증 완료 후 온보딩 캐러셀 1회 노출
    setAuthStatus('authenticated');
  };

  const [fontsLoaded] = useFonts({
    Kkukkukk: require('./fonts/kkukkukk/MemomentKkukkukk.otf'),
    GmarketSansLight:  require('./fonts/gmarket/GmarketSansLight.ttf'),
    GmarketSansMedium: require('./fonts/gmarket/GmarketSansMedium.ttf'),
    GmarketSansBold:   require('./fonts/gmarket/GmarketSansBold.ttf'),
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Meta SDK 초기화 — iOS는 ATT 권한을 물은 뒤 결과를 SDK에 반영한다.
  useEffect(() => {
    A.initAnalytics().catch((e) => {
      if (__DEV__) console.warn('analytics 초기화 실패:', e?.message);
    });
  }, []);

  // 앱 시작 시 햅틱·효과음 설정을 전역 복원 (설정 화면을 열지 않아도 반영)
  useEffect(() => {
    (async () => {
      try {
        const hp = await SecureStore.getItemAsync('haptic');
        const sd = await SecureStore.getItemAsync('sound');
        if (hp !== null) H.setEnabled(hp === 'true');
        if (sd !== null) S.setEnabled(sd === 'true');
      } catch (e) {
        if (__DEV__) console.warn('피드백 설정 복원 실패:', e?.message);
      }
    })();
  }, []);

  useEffect(() => {
    if (fontsLoaded && authStatus !== 'loading') {
      SplashScreen.hideAsync().finally(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      });
    }
  }, [fontsLoaded, authStatus, fadeAnim]);

  /* ── 설정 시간 감지 → 룰렛 표시 ──
     정책: 오늘 미션이 이미 있으면 시간을 바꿔도 룰렛을 다시 띄우지 않음 */
  useMissionRouletteTrigger(missionTime, hasMission, () => {
    setShowRoulette(true);
    setTab('mission');
  });

  /* ── 최상위 3페이지 좌우 스와이프 (Mission | Profile | Settings) ──
     세로 스크롤과 충돌하지 않도록 수평 우세 제스처만 캡처 (ProfileScreen 기존 방식 확장) */
  const pagerResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_, g) => {
        const idx = PAGES.indexOf(tab);
        if (g.dx <= -60 && idx < PAGES.length - 1) { H.tap(); setTab(PAGES[idx + 1]); }
        else if (g.dx >= 60 && idx > 0) { H.tap(); setTab(PAGES[idx - 1]); }
      },
    }),
    [tab],
  );

  /* ── 초대 딥링크 수신 (유니버설 링크 /invite/CODE · offmode:// 스킴) ──
     인증 전에 도착하면 pendingInvite 에 저장했다가 로그인 완료 후 참여 화면으로 이동 */
  const handleInviteUrl = useCallback((url) => {
    const code = parseInviteCode(url);
    if (code) setPendingInvite(code);
  }, []);

  useEffect(() => {
    Linking.getInitialURL().then(url => { if (url) handleInviteUrl(url); }).catch(() => {});
    const sub = Linking.addEventListener('url', ({ url }) => handleInviteUrl(url));
    return () => sub.remove();
  }, [handleInviteUrl]);

  useEffect(() => {
    if (authStatus === 'authenticated' && pendingInvite) {
      setShowRoulette(false);
      setStack(prev => [...prev, { name: 'joinRoom', params: { initialCode: pendingInvite } }]);
      setPendingInvite(null);
    }
  }, [authStatus, pendingInvite]);

  // 회원가입·인증 후 메인 탭은 웜 크림 팔레트를 쓰므로 최상위 크롬(상태바·상단 세이프에어리어)도 크림으로 맞춘다.
  const warmChrome =
    authStatus === 'signingUp' || (authStatus === 'authenticated' && !showRoulette);
  const chromeBg = warmChrome ? W.bg : C.bg;
  const statusStyle = warmChrome ? 'dark' : scheme === 'dark' ? 'light' : 'dark';

  if (!fontsLoaded || authStatus === 'loading') return null;

  const push = (screen, params = null) => setStack(s => [...s, { name: screen, params }]);
  const pop  = ()                       => setStack(s => s.slice(0, -1));
  const topStack     = stack[stack.length - 1] ?? null;
  const currentStack = topStack?.name ?? null;
  const sp           = topStack?.params ?? null;   // 현재 스택 화면 파라미터

  /* 룰렛 완료 → 미션 시작 */
  const handleRouletteStart = async (mission) => {
    setCurrentMission(mission);
    setHasMission(true);
    setShowRoulette(false);
    try {
      const saved = await api.post('/api/v1/missions/today', {
        icon: mission.icon, text: mission.text, category: mission.category,
      });
      setCurrentMissionId(saved.id);
    } catch (e) {
      console.warn('미션 저장 실패:', e);
    }
  };

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StatusBar style={statusStyle} backgroundColor={chromeBg} />
      <SafeAreaView style={{ flex: 1, backgroundColor: chromeBg }} edges={['top']}>

      {/* ── 로그인 화면 ── */}
      {authStatus === 'unauthenticated' && (
        <LoginScreen
          onKakaoLogin={handleKakaoLogin}
          onAppleLogin={handleAppleLogin}
          loading={loginLoading}
          error={loginError}
        />
      )}

      {/* ── 회원가입 화면 ── */}
      {authStatus === 'signingUp' && (
        <SignupScreen
          defaultName={authUser?.name ?? ''}
          onComplete={handleSignupComplete}
        />
      )}

      {/* ── 룰렛 화면 ── */}
      {authStatus === 'authenticated' && showRoulette && (
        <MissionRouletteScreen
          onStart={handleRouletteStart}
          onSkip={() => setShowRoulette(false)}
          autoSpin={autoRoulette}
        />
      )}

      {/* ── 메인 탭 UI ── */}
      {authStatus === 'authenticated' && !showRoulette && (
        <View style={{ flex: 1, backgroundColor: W.bg }}>

          {/* ── 스택 화면 (오버레이) ── */}
          {currentStack === 'missionTime' && (
            <View style={StyleSheet.absoluteFillObject}>
              <MissionTimeScreen
                onBack={pop}
                onSave={(t) => {
                  setMissionTime(t);
                  api.put('/api/v1/users/me', { missionHour: t.hour, missionMinute: t.minute }).catch(e => console.warn('시간 저장 실패:', e));
                  scheduleMissionNotification(t.hour, t.minute);
                  pop();
                }}
                initialTime={missionTime}
              />
            </View>
          )}

          {currentStack === 'verify' && (
            <View style={StyleSheet.absoluteFillObject}>
              <VerifyScreen
                mission={currentMission}
                userMissionId={currentMissionId}
                onBack={pop}
                onVerified={(photoUri) => {
                  // photoUri로 즉시 버튼 숨김 (loadTodayMission 응답 전에도 반영)
                  if (photoUri) setCurrentMission(prev => ({ ...prev, photoUrl: photoUri }));
                  loadTodayMission();
                }}
              />
            </View>
          )}

          {/* ── Rooms v2 스택 화면 ── */}
          {currentStack === 'roomDetail' && (
            <View style={StyleSheet.absoluteFillObject}>
              <RoomDetailScreen
                roomId={sp?.roomId}
                version={roomVersion}
                onBack={pop}
                onChanged={bumpRoom}
                onOpenSettings={() => push('roomSettings', { roomId: sp?.roomId })}
                onOpenMissionPicker={() => push('missionPicker', { roomId: sp?.roomId })}
                onOpenVerify={(room) => push('roomVerify', { room })}
                onOpenProof={(info) => push('proofDetail', { roomId: sp?.roomId, ...info })}
                onOpenHistory={() => push('historyRoom', { roomId: sp?.roomId })}
                onOpenLeaderboard={(info) => push('leaderboard', info)}
                onComplete={handleRoomComplete}
              />
            </View>
          )}

          {currentStack === 'createRoom' && (
            <View style={StyleSheet.absoluteFillObject}>
              <CreateRoomScreen
                onBack={pop}
                onCreated={(room) => { bumpRoom(); setStack([{ name: 'roomDetail', params: { roomId: room.id } }]); }}
              />
            </View>
          )}

          {currentStack === 'joinRoom' && (
            <View style={StyleSheet.absoluteFillObject}>
              <JoinRoomScreen
                onBack={pop}
                initialCode={sp?.initialCode}
                onJoined={(room) => { bumpRoom(); setStack([{ name: 'roomDetail', params: { roomId: room.id } }]); }}
              />
            </View>
          )}

          {currentStack === 'missionPicker' && (
            <View style={StyleSheet.absoluteFillObject}>
              <MissionPickerScreen roomId={sp?.roomId} onBack={pop} onChosen={() => { bumpRoom(); pop(); }} />
            </View>
          )}

          {currentStack === 'roomSettings' && (
            <View style={StyleSheet.absoluteFillObject}>
              <RoomSettingsScreen
                roomId={sp?.roomId}
                onBack={pop}
                onChanged={bumpRoom}
                onLeft={() => { bumpRoom(); setStack([]); }}
              />
            </View>
          )}

          {currentStack === 'roomVerify' && (
            <View style={StyleSheet.absoluteFillObject}>
              <RoomVerifyScreen room={sp?.room} onBack={pop} onVerified={() => { bumpRoom(); pop(); }} />
            </View>
          )}

          {currentStack === 'proofDetail' && (
            <View style={StyleSheet.absoluteFillObject}>
              <ProofDetailScreen
                roomId={sp?.roomId}
                proofId={sp?.proofId}
                missionTitle={sp?.missionTitle}
                isGroup={sp?.isGroup}
                onBack={pop}
                onChanged={bumpRoom}
              />
            </View>
          )}

          {currentStack === 'historyRoom' && (
            <View style={StyleSheet.absoluteFillObject}>
              <RoomHistoryScreen roomId={sp?.roomId} onBack={pop} />
            </View>
          )}

          {currentStack === 'roomComplete' && (
            <View style={StyleSheet.absoluteFillObject}>
              <RoomCompleteScreen summary={sp?.summary} onBack={pop} />
            </View>
          )}

          {currentStack === 'notifications' && (
            <View style={StyleSheet.absoluteFillObject}>
              <NotificationsScreen onBack={pop} />
            </View>
          )}

          {currentStack === 'leaderboard' && (
            <View style={StyleSheet.absoluteFillObject}>
              <LeaderboardScreen roomName={sp?.roomName} roomIcon={sp?.roomIcon} onBack={pop} />
            </View>
          )}

          {currentStack === 'blockedUsers' && (
            <View style={StyleSheet.absoluteFillObject}>
              <BlockedUsersScreen onBack={pop} />
            </View>
          )}

          {/* ── 최상위 4페이지 (좌우 스와이프: Records | Profile | Mission | Settings) ── */}
          <View
            style={[styles.screenWrap, currentStack && { opacity: 0 }]}
            pointerEvents={currentStack ? 'none' : 'auto'}
            {...pagerResponder.panHandlers}
          >
            <View style={{ flex: 1 }}>
              {tab === 'records' && <MyHistoryScreen />}
              {tab === 'mission' && (
                <RoomListScreen
                  version={roomVersion}
                  onOpenRoom={(roomId) => push('roomDetail', { roomId })}
                  onCreate={() => push('createRoom')}
                  onJoin={() => push('joinRoom')}
                  onOpenNotifications={() => push('notifications')}
                />
              )}
              {tab === 'profile' && (
                <ProfileScreen
                  profile={profile}
                  onSaveProfile={setProfile}
                  currentMission={currentMission}
                />
              )}
              {tab === 'settings' && (
                <SettingsScreen
                  onBack={null}
                  onOpenTimeSettings={() => push('missionTime')}
                  missionTime={missionTime}
                  autoRoulette={autoRoulette}
                  onSetAutoRoulette={(val) => {
                    setAutoRoulette(val);
                    api.put('/api/v1/users/me', { autoRoulette: val }).catch(e => console.warn('autoRoulette 저장 실패:', e));
                  }}
                  onLogout={handleLogout}
                  onDeleteAccount={handleDeleteAccount}
                  onOpenBlockedUsers={() => push('blockedUsers')}
                />
              )}
            </View>

            {/* 플로팅 바텀: 인디케이터 + 하단 인셋을 화면 위에 투명 오버레이로 띄움
                → 스크롤 컨텐츠가 그 뒤로 비치는 엣지-투-엣지 룩 */}
            <View style={styles.pagerBottomOverlay} pointerEvents="none">
              <PageIndicator count={PAGES.length} active={PAGES.indexOf(tab)} bg="transparent" />
              <PagerBottomInset />
            </View>
          </View>
        </View>
      )}

      {/* ── 온보딩 캐러셀 (신규 유저, 최상위 오버레이) ── */}
      {authStatus === 'authenticated' && showOnboarding && (
        <View style={StyleSheet.absoluteFillObject}>
          <OnboardingScreen onDone={() => setShowOnboarding(false)} />
        </View>
      )}

      </SafeAreaView>
    </SafeAreaProvider>
    </Animated.View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screenWrap: { flex: 1 },
  pagerBottomOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'transparent' },
});
