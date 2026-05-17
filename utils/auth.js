import * as AppleAuthentication from 'expo-apple-authentication';
import { login as kakaoLogin, getProfile as kakaoGetProfile } from '@react-native-seoul/kakao-login';
import { api, setToken } from './api';

// ── Kakao ────────────────────────────────────────────────
export async function signInWithKakao() {
  const token   = await kakaoLogin();
  const { token: jwt, user, isNew } = await api.post('/api/v1/auth/kakao', {
    accessToken: token.accessToken,
  });
  await setToken(jwt);
  return { jwt, user, isNew };
}

// ── Apple ────────────────────────────────────────────────
export async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  const fullName = credential.fullName
    ? [credential.fullName.givenName, credential.fullName.familyName]
        .filter(Boolean).join(' ')
    : null;

  const { token: jwt, user, isNew } = await api.post('/api/v1/auth/apple', {
    identityToken: credential.identityToken,
    fullName,
  });
  await setToken(jwt);
  return { jwt, user, isNew };
}
