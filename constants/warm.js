/**
 * 웜 크림 디자인 팔레트 (Figma OffMode 리디자인)
 * 현재는 Mission 탭 파일럿에서 사용. 추후 다른 화면으로 확장 예정.
 *
 * Figma 변수 매핑:
 *   back #fff9f3 · basic #fff5ea · 글씨 #2c2420 · text sub #a8958a
 *   색상/deepgreen #2e7d52 · 색상2 #e8513a · 색상3 #7a5c4f
 */
export const W = {
  bg:        '#fff9f3', // back — 화면 배경
  surface:   '#fff5ea', // basic — 카드
  surface2:  '#f3e9db', // 입력/뉴트럴 칩 배경
  text:      '#2c2420', // 글씨
  textSub:   '#a8958a', // text sub
  border:    '#e3d6c6', // 부드러운 구분선
  borderStrong: '#a8958a', // 카드 아웃라인(1.5px)
  neutral:      'rgba(168,149,138,0.5)',  // 뉴트럴 버튼/칩 채움
  neutralFaint: 'rgba(168,149,138,0.22)',

  // 브랜드 / Energy
  green:       '#2e7d52',
  greenFaint:  'rgba(46,125,82,0.12)',
  greenBorder: 'rgba(46,125,82,0.35)',
  // Vitality
  brown:       '#7a5c4f',
  brownFaint:  'rgba(122,92,79,0.12)',
  brownBorder: 'rgba(122,92,79,0.35)',
  // Intellect
  coral:       '#e8513a',
  coralFaint:  'rgba(232,81,58,0.12)',
  coralBorder: 'rgba(232,81,58,0.35)',

  white: '#ffffff',
  black: '#2c2420',
};

/** 미션 카테고리 → 색상 (Vitality 브라운 / Energy 그린 / Intellect 코랄) */
export function catColorsW(cat) {
  if (cat === 'Intellect') return { main: W.coral, faint: W.coralFaint, border: W.coralBorder };
  if (cat === 'Energy')    return { main: W.green, faint: W.greenFaint, border: W.greenBorder };
  return { main: W.brown, faint: W.brownFaint, border: W.brownBorder }; // Vitality
}
