/**
 * 프로필 아바타 = 캐릭터 얼굴(head) PNG.
 *
 * 회원가입에서 고른 아바타(얼굴)와 동일 캐릭터의 전신 몸통은
 * constants/parts.js 의 getCharacterSource() 로 연결된다 (프로필 꾸미기 캔버스).
 *
 * 렌더는 <Image source={...} /> 로 한다 (기존 SVG 컴포넌트 방식 아님).
 */

// 아바타 id → 얼굴 이미지
const FACES = {
  '01': require('../assets/character/character_face_01.png'), // 토끼
  '02': require('../assets/character/character_face_02.png'), // 병아리
  '03': require('../assets/character/character_face_03.png'), // 수달
  '04': require('../assets/character/character_face_04.png'), // 펭귄
  '05': require('../assets/character/character_face_05.png'), // 다람쥐
};

export const AVATAR_IDS = Object.keys(FACES);
export const AVATAR_COUNT = AVATAR_IDS.length;

/**
 * 아바타 얼굴 이미지 source 반환.
 * @param {string} avatarId - '01'~'05'
 * @param {string|null} [_missionStatus] - 호환용 인자. 얼굴 이미지는 상태별 변형이 없다.
 */
export function getAvatarSource(avatarId, _missionStatus) {
  const id = AVATAR_IDS.includes(avatarId) ? avatarId : '01';
  return FACES[id];
}

/**
 * 선택 화면(picker)용 얼굴 이미지 source 반환.
 * 현재 얼굴은 상태 변형이 없어 getAvatarSource와 동일하게 동작한다.
 */
export function getAvatarDefaultSource(avatarId) {
  return getAvatarSource(avatarId);
}
