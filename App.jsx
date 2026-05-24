import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, LogBox } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// [WORKAROUND] RN 0.83 iOS newArch에서 release 빌드 시 RCTFatal abort로 escalate되는
// 알려진 native bridge 노이즈 에러들을 silent suppress.
// - RCTEventEmitter 조기 emit: React renderer 등록 이전의 cosmetic view event
// - Promise 이중 처리: 카카오/Apple 등 SDK의 known race condition (이미 우리 try/catch로 첫 reject는 처리됨)
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
      msg.includes("already been resolved");
    if (isNoiseError) {
      console.warn('[RN0.83 workaround] suppressed bridge noise:', msg.slice(0, 200));
      return;
    }
    originalHandler?.(error, isFatal);
  });
}
import T from './components/ThemedText';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import MissionScreen from './screens/MissionScreen';
import FeedScreen from './screens/FeedScreen';
import ProfileScreen from './screens/ProfileScreen';
import MissionTimeScreen from './screens/MissionTimeScreen';
import MissionRouletteScreen from './screens/MissionRouletteScreen';
import VerifyScreen from './screens/VerifyScreen';
import SettingsScreen from './screens/SettingsScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import { ThemeProvider, useTheme } from './utils/ThemeContext';
import { signInWithApple, signInWithKakao } from './utils/auth';
import { api, loadToken, clearToken } from './utils/api';
import { scheduleMissionNotification, cancelMissionNotification } from './utils/notifications';

SplashScreen.preventAutoHideAsync().catch(() => {});

const TABS = [
  { key: 'mission',  label: '[MISSION]',     ionicon: 'home-outline'     },
  { key: 'feed',     label: '[FEED]',        ionicon: 'list-outline'     },
  { key: 'profile',  label: '[PROFILE]',     ionicon: 'person-outline'   },
  { key: 'settings', label: '[SETTINGS]',    ionicon: 'settings-outline' },
];

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
  const lastTriggeredRef = useRef(null);

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

  const statusStyle  = scheme === 'dark' ? 'light' : 'dark';
  const navBg        = C.isDark ? '#0a0a12' : C.surface;
  const navBorder    = C.isDark ? 'rgba(34,201,122,0.4)' : C.greenBorder;
  const navShadow    = C.isDark ? '#22c97a' : 'transparent';
  const navIconColor = C.isDark ? '#aaa' : '#888';

  if (!fontsLoaded || authStatus === 'loading') return null;

  const push = (screen) => setStack(s => [...s, screen]);
  const pop  = ()       => setStack(s => s.slice(0, -1));
  const currentStack = stack[stack.length - 1];

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

          {/* ── 탭 화면 ── */}
          <View
            style={[styles.screenWrap, currentStack && { opacity: 0 }]}
            pointerEvents={currentStack ? 'none' : 'auto'}
          >
            {tab === 'mission' && (
              <MissionScreen
                missionTime={missionTime}
                onOpenTimeSettings={() => push('missionTime')}
                onOpenRoulette={() => setShowRoulette(true)}
                onOpenVerify={() => push('verify')}
                hasMission={hasMission}
                currentMission={currentMission}
              />
            )}
            {tab === 'feed'     && <FeedScreen />}
            {tab === 'profile'  && (
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

          {/* ── 탭 바 ── */}
          {!currentStack && (
            <View style={[styles.navBar, {
              backgroundColor: navBg,
              borderColor: navBorder,
              shadowColor: navShadow,
            }]}>
              {TABS.map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={styles.navItem}
                  onPress={() => setTab(t.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={t.ionicon}
                    size={22}
                    color={tab === t.key ? C.green : navIconColor}
                  />
                  <T v="label" size={9} color={tab === t.key ? C.green : navIconColor} style={{ opacity: tab === t.key ? 1 : 0.7, letterSpacing: 0.2 }}>
                    {t.label}
                  </T>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      </SafeAreaView>
    </SafeAreaProvider>
    </Animated.View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  screenWrap: { flex: 1 },

  navBar: {
    position: 'absolute',
    bottom: 20,
    marginHorizontal: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
