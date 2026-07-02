/**
 * 캐릭터 꾸미기 파츠 카탈로그 (프론트).
 * 백엔드 PartDefinition(boundedcontext/part)과 key·표시순서·해금 임계값을 동일하게 맞춘다.
 *
 * - unlockThreshold: 누적 인증 미션 수 기준. null 이면 Coming Soon(항상 잠김).
 * - image: 그리드/오버레이에 쓰는 로컬 에셋.
 *
 * 해금/장착 상태는 #107에서 GET /api/v1/parts/me 로 받아 합친다.
 * 이 파일은 정적 메타(이미지·이름·순서·임계값)만 가진다.
 */

export const PARTS = [
  { key: 'leaf', name: '새싹', unlockThreshold: 1, image: require('../assets/character/leaf.png') },
  { key: 'crown', name: '왕관', unlockThreshold: 2, image: require('../assets/character/crown.png') },
  { key: 'sunglass', name: '선글라스', unlockThreshold: 3, image: require('../assets/character/sunglass.png') },
  { key: 'twinkle', name: '반짝이', unlockThreshold: 5, image: require('../assets/character/twinkle.png') },
  { key: 'heart', name: '하트', unlockThreshold: 7, image: require('../assets/character/heart.png') },
  { key: 'ribbon', name: '리본', unlockThreshold: 10, image: require('../assets/character/ribbon.png') },
  { key: 'star', name: '별', unlockThreshold: 13, image: require('../assets/character/star.png') },
  { key: 'glasses', name: '안경', unlockThreshold: 16, image: require('../assets/character/glasses.png') },
  { key: 'peakedHat', name: '고깔모자', unlockThreshold: 19, image: require('../assets/character/peakedHat.png') },
  { key: 'doubleHeart', name: '더블하트', unlockThreshold: 22, image: require('../assets/character/doubleHeart.png') },
  { key: 'angelRing', name: '천사링', unlockThreshold: 25, image: require('../assets/character/angelRing.png') },
  { key: 'beret', name: '베레모', unlockThreshold: 28, image: require('../assets/character/beret.png') },
  { key: 'starTwinkle', name: '별빛', unlockThreshold: 31, image: require('../assets/character/starTwinkle.png') },
  { key: 'comingSoon14', name: '준비 중', unlockThreshold: null, image: require('../assets/character/comingSoon14.png') },
  { key: 'comingSoon15', name: '준비 중', unlockThreshold: null, image: require('../assets/character/comingSoon15.png') },
  { key: 'comingSoon16', name: '준비 중', unlockThreshold: null, image: require('../assets/character/comingSoon16.png') },
].map((p, i) => ({ ...p, order: i + 1 }));

/** key → 파츠 메타 빠른 조회 */
export const PART_BY_KEY = Object.fromEntries(PARTS.map((p) => [p.key, p]));

/** 캐릭터 베이스 이미지 (기본: 토끼 = avatar_01) */
export const CHARACTER_BASE = require('../assets/character/character_full_01.png');

/**
 * 아바타 id → 꾸미기 캐릭터(전신 몸통) 이미지.
 * 회원가입에서 고른 얼굴 아바타와 동일 캐릭터의 전신 몸통을 연결한다.
 */
export const CHARACTER_BY_AVATAR = {
  '01': require('../assets/character/character_full_01.png'), // 토끼
  '02': require('../assets/character/character_full_02.png'), // 병아리
  '03': require('../assets/character/character_full_03.png'), // 수달
  '04': require('../assets/character/character_full_04.png'), // 펭귄
  '05': require('../assets/character/character_full_05.png'), // 다람쥐
};

/** 아바타 id에 맞는 몸통 이미지 반환 (없으면 기본 토끼) */
export function getCharacterSource(avatarId) {
  return CHARACTER_BY_AVATAR[avatarId] ?? CHARACTER_BASE;
}

/** 누적 인증 미션 수 기준 해금 여부 (백엔드와 동일 기준) */
export function isPartUnlocked(part, verifiedCount) {
  return part.unlockThreshold != null && verifiedCount >= part.unlockThreshold;
}

/**
 * 표시용 파츠 상태 배열 생성. (#106 정적 UI 및 #107 fallback)
 * @param {number} verifiedCount 누적 인증 미션 수
 * @param {string|null} equippedKey 장착 파츠 key
 */
export function buildPartsState(verifiedCount, equippedKey) {
  return PARTS.map((p) => ({
    ...p,
    unlocked: isPartUnlocked(p, verifiedCount),
    equipped: p.key === equippedKey,
  }));
}
