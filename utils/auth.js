import * as AppleAuthentication from 'expo-apple-authentication';
import { login as kakaoLogin } from '@react-native-seoul/kakao-login';
import { api, setToken } from './api';

const withLoginError = (message, code, cause) => Object.assign(new Error(message), { code, cause });

// ── Kakao ────────────────────────────────────────────────
export async function signInWithKakao() {
  let token;
  try {
    token = await kakaoLogin();
  } catch (e) {
    throw withLoginError('카카오 로그인 창을 여는 중 문제가 발생했습니다.', 'KAKAO_SDK_FAILED', e);
  }

  let authResponse;
  try {
    authResponse = await api.post('/api/v1/auth/kakao', {
      accessToken: token.accessToken,
    });
  } catch (e) {
    throw withLoginError(e?.message || '카카오 인증 서버 요청에 실패했습니다.', 'KAKAO_API_FAILED', e);
  }

  const { token: jwt, user, isNew } = authResponse;
  await setToken(jwt);
  return { jwt, user, isNew };
}

// ── Apple ────────────────────────────────────────────────
export async function signInWithApple() {
  let credential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (e) {
    if (e?.code === 'ERR_CANCELED') throw e;
    throw withLoginError('Apple 로그인 창을 여는 중 문제가 발생했습니다.', 'APPLE_SDK_FAILED', e);
  }

  const fullName = credential.fullName
    ? [credential.fullName.givenName, credential.fullName.familyName]
        .filter(Boolean).join(' ')
    : null;

  let authResponse;
  try {
    authResponse = await api.post('/api/v1/auth/apple', {
      identityToken: credential.identityToken,
      fullName,
    });
  } catch (e) {
    throw withLoginError(e?.message || 'Apple 인증 서버 요청에 실패했습니다.', 'APPLE_API_FAILED', e);
  }

  const { token: jwt, user, isNew } = authResponse;
  await setToken(jwt);
  return { jwt, user, isNew };
}
