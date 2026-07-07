/**
 * Sounds utility — 앱 전체 효과음을 일관되게 재생하기 위한 모듈.
 *
 * haptics.js 와 동일한 API(tap/success/error)를 제공하며, 각 H.* 호출이
 * 내부에서 이 모듈을 함께 트리거한다(haptics.js 참고). 효과음 on/off 는
 * 햅틱과 독립된 플래그(_enabled)로 제어하고 SecureStore('sound')에 저장된다.
 *
 * 애셋(assets/sounds/*.wav)은 합성된 기본 사운드이며 자유롭게 교체 가능하다.
 * 효과음 설정을 켜면 iOS 무음 스위치 상태와 무관하게 재생한다(playsInSilentModeIOS: true).
 */
import { Audio } from 'expo-av';

let _enabled = false;
let _sounds = null; // { tap, success, error } → Audio.Sound
let _loading = null;

async function ensureLoaded() {
  if (_sounds) return _sounds;
  if (_loading) return _loading;
  _loading = (async () => {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true });
    const [tap, success, error] = await Promise.all([
      Audio.Sound.createAsync(require('../assets/sounds/tap.wav'), { volume: 0.7 }),
      Audio.Sound.createAsync(require('../assets/sounds/success.wav'), { volume: 0.8 }),
      Audio.Sound.createAsync(require('../assets/sounds/error.wav'), { volume: 0.8 }),
    ]);
    _sounds = { tap: tap.sound, success: success.sound, error: error.sound };
    return _sounds;
  })();
  return _loading;
}

async function play(key) {
  if (!_enabled) return;
  try {
    const snd = (await ensureLoaded())[key];
    if (snd) await snd.replayAsync(); // 항상 처음부터 (빠른 연타 대응)
  } catch (e) {
    if (__DEV__) console.warn('효과음 재생 실패:', key, e?.message);
  }
}

export const setEnabled = (v) => {
  _enabled = v;
  if (v) ensureLoaded().catch(() => {}); // 켤 때 미리 로드
};
export const isEnabled = () => _enabled;

export const tap     = () => { play('tap'); };
export const success = () => { play('success'); };
export const error   = () => { play('error'); };
