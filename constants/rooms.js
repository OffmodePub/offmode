/**
 * Rooms v2 공용 상수 — 방 아이콘(enum) ↔ emoji 매핑 등.
 * API 계약(rooms-v2-api-contract.md)의 iconKey enum과 1:1 대응.
 */

// 방 아이콘 enum → emoji
export const ROOM_ICONS = {
  FIRE:    '🔥',
  MOON:    '🌙',
  COFFEE:  '☕',
  RUN:     '🏃',
  BOOKS:   '📚',
  SPARKLE: '✨',
};

export const ROOM_ICON_KEYS = Object.keys(ROOM_ICONS);

export function roomIconEmoji(iconKey) {
  return ROOM_ICONS[iconKey] ?? '✨';
}

// 리액션 기본 노출 emoji (계약: 자유 emoji 문자열, 기본 3종 + 자유 추가)
export const DEFAULT_REACTIONS = ['🔥', '👍', '❤️'];

// 이모지 피커 팔레트 (+ 버튼)
export const EMOJI_PALETTE = [
  '🔥', '👍', '❤️', '😍', '👏', '🎉', '💪', '✨',
  '🙌', '😆', '🥰', '😮', '🤝', '🌟', '💚', '🫶',
  '☀️', '🌈', '🍀', '⭐', '😎', '🥳', '👀', '💯',
];
