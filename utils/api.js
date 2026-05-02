import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// 실기기 테스트 시: Mac의 로컬 IP 주소로 변경하세요
// 예) const DEV_HOST = '192.168.0.10';
//const DEV_HOST = Platform.OS === 'ios' ? 'localhost' : '10.0.2.2';
const DEV_HOST = '192.168.219.185';

export const BASE_URL = __DEV__
  ? `http://${DEV_HOST}:8080`
  : 'https://offmode-production.up.railway.app';

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
  console.log(`[API] ${method} ${path} | token: ${_token ? _token.slice(0, 20) + '...' : 'NONE'}`);

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw Object.assign(new Error(data?.message || `요청 실패 (${res.status})`), { status: res.status });
  return data;
}

export const api = {
  get:    (path)           => request('GET',    path),
  post:   (path, body)     => request('POST',   path, body),
  put:    (path, body)     => request('PUT',    path, body),
  delete: (path)           => request('DELETE', path),
  upload: (path, formData) => request('POST',   path, formData, true),
};
