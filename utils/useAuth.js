import { useState, useEffect, useRef } from 'react';
import { signInWithApple, signInWithKakao } from './auth';
import { api, loadToken, clearToken, setOnUnauthorized } from './api';
import { cancelMissionNotification, unregisterPushToken } from './notifications';

/*
 * 인증 상태머신 훅 — authStatus: 'loading' | 'unauthenticated' | 'signingUp' | 'authenticated'
 *
 * 자동 로그인·카카오/애플 로그인의 공통 후처리(프로필 세팅, 오늘 미션 로드, 알림 예약)는
 * App.jsx가 applySession 으로 주입한다. 로그아웃 시 미션/프로필 상태 초기화는 resetSession.
 * API가 401(세션 만료)을 반환하면 자동으로 로그아웃 처리한다.
 */
export default function useAuth({ applySession, resetSession }) {
  const [authStatus, setAuthStatus]     = useState('loading');
  const [authUser, setAuthUser]         = useState(null);
  const [authProvider, setAuthProvider] = useState(null);  // 'kakao' | 'apple' — 가입 완료 이벤트에 사용
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError]     = useState('');

  // ── 자동 로그인: 토큰 복원 → /users/me → 세션 적용
  useEffect(() => {
    loadToken().then(async (token) => {
      if (!token) {
        setAuthStatus('unauthenticated');
        return;
      }
      try {
        const user = await api.get('/api/v1/users/me');
        await applySession(user);
        setAuthStatus('authenticated');
      } catch (e) {
        console.warn('자동 로그인 실패:', e);
        setAuthStatus('unauthenticated');
      }
    }).catch((e) => {
      console.warn('자동 로그인 토큰 로드 실패:', e);
      setAuthStatus('unauthenticated');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (signIn, fallbackMessage, provider) => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const { user, isNew } = await signIn();
      setAuthUser(user);
      setAuthProvider(provider);
      if (!isNew) await applySession(user);
      setAuthStatus(isNew ? 'signingUp' : 'authenticated');
    } catch (e) {
      if (e?.code !== 'ERR_CANCELED') {
        console.warn(e);
        setLoginError(e?.message || fallbackMessage);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleKakaoLogin = () => login(signInWithKakao, '카카오 로그인에 실패했습니다.', 'kakao');
  const handleAppleLogin = () => login(signInWithApple, 'Apple 로그인에 실패했습니다.', 'apple');

  // 401 경로에서 unregisterPushToken 이 다시 401을 받아 재진입하는 것을 막는다
  const loggingOutRef = useRef(false);

  const handleLogout = async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    try {
      await unregisterPushToken();   // 토큰을 지우기 전에 서버 등록 해제 (다른 계정 오배송 방지)
      await cancelMissionNotification();
      await clearToken();
      setAuthUser(null);
      setAuthProvider(null);
      resetSession();
      setAuthStatus('unauthenticated');
    } finally {
      loggingOutRef.current = false;
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/api/v1/users/me');
    } catch (e) {
      console.warn('회원탈퇴 실패:', e);
    }
    await handleLogout();
  };

  // ── 세션 만료(401) 전역 처리 — 항상 최신 핸들러가 등록되도록 매 렌더 갱신
  useEffect(() => {
    setOnUnauthorized(() => { handleLogout().catch(() => {}); });
    return () => setOnUnauthorized(null);
  });

  return {
    authStatus,
    setAuthStatus,
    authUser,
    authProvider,
    loginLoading,
    loginError,
    handleKakaoLogin,
    handleAppleLogin,
    handleLogout,
    handleDeleteAccount,
  };
}
