import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const DEFAULT_DEV_PORT = '8080';
const DEFAULT_PROD_BASE_URL = 'https://api.offmodechallenge.com';
const REQUEST_TIMEOUT_MS = 15000;

const trimTrailingSlash = (url) => url.replace(/\/+$/, '');

const getDefaultDevHost = () => {
  if (Platform.OS === 'android') return '10.0.2.2';
  return 'localhost';
};

const buildDevBaseUrl = () => {
  const explicitBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (explicitBaseUrl) return trimTrailingSlash(explicitBaseUrl);

  const host = process.env.EXPO_PUBLIC_DEV_API_HOST || getDefaultDevHost();
  const port = process.env.EXPO_PUBLIC_DEV_API_PORT || DEFAULT_DEV_PORT;
  return `http://${host}:${port}`;
};

const buildProdBaseUrl = () => (
  process.env.EXPO_PUBLIC_PROD_API_BASE_URL || DEFAULT_PROD_BASE_URL
);

export const BASE_URL = trimTrailingSlash(__DEV__ ? buildDevBaseUrl() : buildProdBaseUrl());

if (__DEV__) {
  console.info(`[API] BASE_URL=${BASE_URL}`);
}

const TOKEN_KEY = 'auth_token';

let _token = null;
export const setToken = async (t) => {
  _token = t;
  if (t) await SecureStore.setItemAsync(TOKEN_KEY, t);
  else    await SecureStore.deleteItemAsync(TOKEN_KEY);
};
export const loadToken  = async () => { _token = await SecureStore.getItemAsync(TOKEN_KEY); return _token; };
export const getToken   = ()       => _token;
export const clearToken = ()       => setToken(null);

async function request(method, path, body, isFormData = false) {
  const headers = {};
  if (_token)       headers['Authorization'] = `Bearer ${_token}`;
  if (!isFormData)  headers['Content-Type']  = 'application/json';
  const url = `${BASE_URL}${path}`;
  console.log(`[API] ${method} ${path} | token: ${_token ? _token.slice(0, 20) + '...' : 'NONE'}`);

  let res;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    res = await fetch(url, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    if (__DEV__) {
      console.warn(`[API] ${method} ${url} 네트워크 요청 실패`, e);
    }
    const timeoutMessage =
      e?.name === 'AbortError' ? `요청 시간이 초과되었습니다. (${BASE_URL})` : null;
    const networkMessage =
      `API 서버에 연결할 수 없습니다. (${BASE_URL}) ` +
      '실기기 테스트 중이라면 .env의 API 서버 주소가 현재 PC LAN IP인지 확인하세요.';
    throw Object.assign(new Error(timeoutMessage || networkMessage), { cause: e });
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      if (__DEV__) console.warn('[API] JSON 응답 파싱 실패', text);
    }
  }
  if (__DEV__) {
    console.info(`[API] ${method} ${url} -> ${res.status}`);
    if (!res.ok && data) console.warn('[API] error body', data);
  }
  if (!res.ok) throw Object.assign(new Error(data?.message || text || `요청 실패 (${res.status})`), { status: res.status });
  return data;
}

export const api = {
  get:    (path)           => request('GET',    path),
  post:   (path, body)     => request('POST',   path, body),
  put:    (path, body)     => request('PUT',    path, body),
  delete: (path)           => request('DELETE', path),
  upload: (path, formData) => request('POST',   path, formData, true),
};
