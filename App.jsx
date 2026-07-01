import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, LogBox, Platform, PanResponder } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import PageIndicator from './components/PageIndicator';
import { W } from './constants/warm';
import * as H from './utils/haptics';
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
import ProfileScreen from './screens/ProfileScreen';
import MissionTimeScreen from './screens/MissionTimeScreen';
import MissionRouletteScreen from './screens/MissionRouletteScreen';
import VerifyScreen from './screens/VerifyScreen';
import SettingsScreen from './screens/SettingsScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
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
import { signInWithApple, signInWithKakao } from './utils/auth';
import { api, loadToken, clearToken } from './utils/api';
import { scheduleMissionNotification, cancelMissionNotification } from './utils/notifications';

SplashScreen.preventAutoHideAsync().catch(() => {});

// 최상위 3페이지 좌우 스와이프 순서 (Profile 가운데). Feed 탭은 RoomDetail로 흡수되어 제거됨.
const PAGES = ['mission', 'profile', 'settings'];

function AppInner() {
  const { colors: C, scheme } = useTheme();

  // ── 인증 상태: 'loading' | 'unauthenticated' | 'signingUp' | 'authenticated'
  const [authStatus, setAuthStatus] = useState('loading');
  const [authUser,   setAuthUser]   = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    loadToken().then(async (token) => {
      if (token) {
        try {
          const user = await api.get('/api/v1/users/me');
          setProfile({ name: user.name ?? '오프모더', avatar: user.avatar ?? '01' });
          const hour   = user.missionHour   ?? 8;
          const minute = user.missionMinute ?? 0;
          if (user.missionHour != null) setMissionTime({ hour, minute });
          if (user.autoRoulette != null) setAutoRoulette(user.autoRoulette);
          await loadTodayMission();
          scheduleMissionNotification(hour, minute);
          setAuthStatus('authenticated');
        } catch (e) {
          console.warn('자동 로그인 실패:', e);
          setAuthStatus('unauthenticated');
        }
      } else {
        setAuthStatus('unauthenticated');
      }
    }).catch((e) => {
      console.warn('자동 로그인 토큰 로드 실패:', e);
      setAuthStatus('unauthenticated');
    });
  }, []);

  const [tab, setTab]                           = useState('mission');
  const [stack, setStack]                       = useState([]);
  const [missionTime, setMissionTime]           = useState({ hour: 8, minute: 0 });
  const [hasMission, setHasMission]             = useState(false);
  const [currentMission, setCurrentMission]     = useState(null);
  const [currentMissionId, setCurrentMissionId] = useState(null);
  const [showRoulette, setShowRoulette]         = useState(false);
  const [autoRoulette, setAutoRoulette]         = useState(true);
  const [profile, setProfile]                   = useState({ name: '오프모더', avatar: '01' });
  const [roomVersion, setRoomVersion]           = useState(0);
  const lastTriggeredRef = useRef(null);
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

  const handleKakaoLogin = async () => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const { user, isNew } = await signInWithKakao();
      setAuthUser(user);
      if (!isNew) {
        setProfile({ name: user.name ?? '오프모더', avatar: user.avatar ?? '01' });
        const hour   = user.missionHour   ?? 8;
        const minute = user.missionMinute ?? 0;
        if (user.missionHour != null) setMissionTime({ hour, minute });
        if (user.autoRoulette != null) setAutoRoulette(user.autoRoulette);
        await loadTodayMission();
        scheduleMissionNotification(hour, minute);
      }
      setAuthStatus(isNew ? 'signingUp' : 'authenticated');
    } catch (e) {
      console.warn(e);
      setLoginError(e?.message || '카카오 로그인에 실패했습니다.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const { user, isNew } = await signInWithApple();
      setAuthUser(user);
      if (!isNew) {
        setProfile({ name: user.name ?? '오프모더', avatar: user.avatar ?? '01' });
        const hour   = user.missionHour   ?? 8;
        const minute = user.missionMinute ?? 0;
        if (user.missionHour != null) setMissionTime({ hour, minute });
        if (user.autoRoulette != null) setAutoRoulette(user.autoRoulette);
        await loadTodayMission();
        scheduleMissionNotification(hour, minute);
      }
      setAuthStatus(isNew ? 'signingUp' : 'authenticated');
    } catch (e) {
      if (e?.code !== 'ERR_CANCELED') {
        console.warn(e);
        setLoginError(e?.message || 'Apple 로그인에 실패했습니다.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await cancelMissionNotification();
    await clearToken();
    setAuthUser(null);
    setProfile({ name: '오프모더', avatar: '01' });
    setMissionTime({ hour: 8, minute: 0 });
    setHasMission(false);
    setCurrentMission(null);
    setCurrentMissionId(null);
    setAuthStatus('unauthenticated');
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/api/v1/users/me');
    } catch (e) {
      console.warn('회원탈퇴 실패:', e);
    }
    await handleLogout();
  };

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
    setAuthStatus('authenticated');
  };

  const [fontsLoaded] = useFonts({
    Kkukkukk: require('./fonts/kkukkukk/MemomentKkukkukk.otf'),
    GmarketSansLight:  require('./fonts/gmarket/GmarketSansLight.ttf'),
    GmarketSansMedium: require('./fonts/gmarket/GmarketSansMedium.ttf'),
    GmarketSansBold:   require('./fonts/gmarket/GmarketSansBold.ttf'),
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (fontsLoaded && authStatus !== 'loading') {
      SplashScreen.hideAsync().finally(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      });
    }
  }, [fontsLoaded, authStatus, fadeAnim]);

  /* ── 설정 시간 감지 → 룰렛 표시 ──
     정책: 오늘 미션이 이미 있으면 시간을 바꿔도 룰렛을 다시 띄우지 않음 */
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      const key = `${now.getHours()}:${now.getMinutes()}`;
      if (
        now.getHours()   === missionTime.hour &&
        now.getMinutes() === missionTime.minute &&
        lastTriggeredRef.current !== key &&
        !hasMission   // 오늘 미션이 없을 때만 룰렛 트리거
      ) {
        lastTriggeredRef.current = key;
        setShowRoulette(true);
        setTab('mission');
      }
    }, 1000);
    return () => clearInterval(id);
  }, [missionTime, hasMission]);

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

  const statusStyle = scheme === 'dark' ? 'light' : 'dark';

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
      <StatusBar style={statusStyle} backgroundColor={C.bg} />
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>

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
        <View style={{ flex: 1, backgroundColor: C.bg }}>

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

          {/* ── 최상위 3페이지 (좌우 스와이프: Mission | Profile | Settings) ── */}
          <View
            style={[styles.screenWrap, currentStack && { opacity: 0 }]}
            pointerEvents={currentStack ? 'none' : 'auto'}
            {...pagerResponder.panHandlers}
          >
            <View style={{ flex: 1 }}>
              {tab === 'mission' && (
                <RoomListScreen
                  version={roomVersion}
                  onOpenRoom={(roomId) => push('roomDetail', { roomId })}
                  onCreate={() => push('createRoom')}
                  onJoin={() => push('joinRoom')}
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
                />
              )}
            </View>

            {/* 페이지 인디케이터 (3페이지 공통) — 웜 페이지는 크림, 설정은 테마 배경 */}
            <PageIndicator count={PAGES.length} active={PAGES.indexOf(tab)} bg={tab === 'settings' ? C.bg : W.bg} />
          </View>
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
});
