/**
 * 초대 링크 공용 유틸.
 * - 공유용 링크: https://offmodechallenge.com/invite/{CODE}
 *   (설치자는 유니버설/앱 링크로 앱이 열리고, 미설치자는 웹 랜딩 페이지로 이동)
 * - 웹 랜딩이 앱을 열 때 쓰는 스킴 폴백: offmode://join?code={CODE}
 *
 * 웹 랜딩·유니버설 링크 호스팅 설정은 web/invite/README.md 참고.
 */
export const INVITE_WEB_BASE = 'https://offmodechallenge.com/invite';

export const buildInviteUrl = (code) => `${INVITE_WEB_BASE}/${encodeURIComponent(String(code).trim())}`;

/** 딥링크/유니버설 링크 URL에서 초대코드를 추출한다. 없으면 null. */
export function parseInviteCode(url) {
  if (!url) return null;
  // /invite/CODE  (유니버설 링크·웹 랜딩)
  const path = String(url).match(/\/invite\/([A-Za-z0-9]{3,12})/);
  if (path) return path[1].toUpperCase();
  // ?code=CODE / &code=CODE  (offmode:// 스킴 폴백)
  const q = String(url).match(/[?&]code=([A-Za-z0-9]{3,12})/);
  if (q) return q[1].toUpperCase();
  return null;
}
