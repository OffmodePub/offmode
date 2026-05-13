/**
 * profile_avatar SVG 매핑
 */

// ✅ avatar_01
import A01Default from '../assets/profile_avatar/avatar_01/avatar_01_default.svg';
import A01Active from '../assets/profile_avatar/avatar_01/avatar_01_active.svg';
import A01Done from '../assets/profile_avatar/avatar_01/avatar_01_done.svg';
import A01Pending from '../assets/profile_avatar/avatar_01/avatar_01_pending.svg';
import A01Verified from '../assets/profile_avatar/avatar_01/avatar_01_verified.svg';

// ✅ avatar_02
import A02Default from '../assets/profile_avatar/avatar_02/avatar_02_default.svg';
import A02Active from '../assets/profile_avatar/avatar_02/avatar_02_active.svg';
import A02Done from '../assets/profile_avatar/avatar_02/avatar_02_done.svg';
import A02Pending from '../assets/profile_avatar/avatar_02/avatar_02_pending.svg';
import A02Verified from '../assets/profile_avatar/avatar_02/avatar_02_verified.svg';

// ✅ avatar_03
import A03Default from '../assets/profile_avatar/avatar_03/avatar_03_default.svg';
import A03Active from '../assets/profile_avatar/avatar_03/avatar_03_active.svg';
import A03Done from '../assets/profile_avatar/avatar_03/avatar_03_done.svg';
import A03Pending from '../assets/profile_avatar/avatar_03/avatar_03_pending.svg';
import A03Verified from '../assets/profile_avatar/avatar_03/avatar_03_verified.svg';

// ✅ avatar_04
import A04Default from '../assets/profile_avatar/avatar_04/avatar_04_default.svg';
import A04Active from '../assets/profile_avatar/avatar_04/avatar_04_active.svg';
import A04Done from '../assets/profile_avatar/avatar_04/avatar_04_done.svg';
import A04Pending from '../assets/profile_avatar/avatar_04/avatar_04_pending.svg';
import A04Verified from '../assets/profile_avatar/avatar_04/avatar_04_verified.svg';

// ✅ avatar_05
import A05Default from '../assets/profile_avatar/avatar_05/avatar_05_default.svg';
import A05Active from '../assets/profile_avatar/avatar_05/avatar_05_active.svg';
import A05Done from '../assets/profile_avatar/avatar_05/avatar_05_done.svg';
import A05Pending from '../assets/profile_avatar/avatar_05/avatar_05_pending.svg';
import A05Verified from '../assets/profile_avatar/avatar_05/avatar_05_verified.svg';

// ✅ avatar_06
import A06Default from '../assets/profile_avatar/avatar_06/avatar_06_default.svg';
import A06Active from '../assets/profile_avatar/avatar_06/avatar_06_active.svg';
import A06Done from '../assets/profile_avatar/avatar_06/avatar_06_done.svg';
import A06Pending from '../assets/profile_avatar/avatar_06/avatar_06_pending.svg';
import A06Verified from '../assets/profile_avatar/avatar_06/avatar_06_verified.svg';

export const AVATAR_COUNT = 6;


// 🔥 상태별 매핑
const IMAGES = {
  '01': {
    default: A01Default,
    active: A01Active,
    done: A01Done,
    pending: A01Pending,
    verified: A01Verified,
  },
  '02': {
    default: A02Default,
    active: A02Active,
    done: A02Done,
    pending: A02Pending,
    verified: A02Verified,
  },
  '03': {
    default: A03Default,
    active: A03Active,
    done: A03Done,
    pending: A03Pending,
    verified: A03Verified,
  },
  '04': {
    default: A04Default,
    active: A04Active,
    done: A04Done,
    pending: A04Pending,
    verified: A04Verified,
  },
  '05': {
    default: A05Default,
    active: A05Active,
    done: A05Done,
    pending: A05Pending,
    verified: A05Verified,
  },
  '06': {
    default: A06Default,
    active: A06Active,
    done: A06Done,
    pending: A06Pending,
    verified: A06Verified,
  },
};

export const AVATAR_IDS = Object.keys(IMAGES);

/**
 * 미션 status → 아바타 state 변환
 * status: null | 'active' | 'done' | 'pending' | 'verified'
 */
function statusToAvatarState(missionStatus) {
  if (!missionStatus) return 'default';
  if (missionStatus === 'verified') return 'verified';
  if (missionStatus === 'done')     return 'done';
  if (missionStatus === 'pending')  return 'pending';
  return 'active'; // 미션 있지만 아직 처리 안 됨
}

/**
 * 아바타 이미지 source 반환
 * @param {string} avatarId - '01'~'06'
 * @param {string|null} missionStatus - currentMission?.status
 */
export function getAvatarSource(avatarId, missionStatus) {
  const id = AVATAR_IDS.includes(avatarId) ? avatarId : '01';
  const state = statusToAvatarState(missionStatus);
  return IMAGES[id][state];
}

/**
 * 선택 화면(picker)용 default 이미지
 */
export function getAvatarDefaultSource(avatarId) {
  const id = AVATAR_IDS.includes(avatarId) ? avatarId : '01';
  return IMAGES[id].default;
}
