export const dark = {
  isDark:       true,
  bg:           '#0d0d14',
  surface:      '#111120',
  surface2:     '#181828',
  green:        '#22c97a',
  greenFaint:   'rgba(34, 201, 122, 0.12)',
  greenBorder:  'rgba(34, 201, 122, 0.35)',
  purple:       '#9b6dff',
  purpleFaint:  'rgba(155, 109, 255, 0.12)',
  purpleBorder: 'rgba(155, 109, 255, 0.35)',
  blue:         '#4da8da',
  blueFaint:    'rgba(77, 168, 218, 0.12)',
  blueBorder:   'rgba(77, 168, 218, 0.35)',
  danger:       '#ff6b72',
  text:         '#ddddf0',
  textSub:      '#9090b8',
  border:       '#2e2e4a',
};

export const light = {
  isDark:       false,
  bg:           '#f3f3f8',
  surface:      '#ffffff',
  surface2:     '#e8e8f2',
  green:        '#0aa05a',
  greenFaint:   'rgba(10, 160, 90, 0.09)',
  greenBorder:  'rgba(10, 160, 90, 0.28)',
  purple:       '#6535cc',
  purpleFaint:  'rgba(101, 53, 204, 0.09)',
  purpleBorder: 'rgba(101, 53, 204, 0.26)',
  blue:         '#2880b8',
  blueFaint:    'rgba(40, 128, 184, 0.09)',
  blueBorder:   'rgba(40, 128, 184, 0.26)',
  danger:       '#d1242f',
  text:         '#18182c',
  textSub:      '#56567a',
  border:       '#d5d5e5',
};

/** 하위 호환용 — 기존 코드가 import { C } 쓰는 경우 대비 */
export const C = dark;
