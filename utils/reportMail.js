import { Alert, Linking } from 'react-native';

const DEFAULT_REPORT_EMAIL = 'calla20032@naver.com';
export const REPORT_EMAIL = process.env.EXPO_PUBLIC_REPORT_EMAIL || DEFAULT_REPORT_EMAIL;

export const REPORT_REASONS = [
  { key: 'SPAM',      label: '스팸 / 광고',           },
  { key: 'OFFENSIVE', label: '욕설 / 혐오 표현',      },
  { key: 'SEXUAL',    label: '성적인 콘텐츠',         },
  { key: 'VIOLENCE',  label: '폭력적 / 위협적 콘텐츠',},
  { key: 'OTHER',     label: '기타',                  },
];

function pad(n) {
  return String(n).padStart(2, '0');
}

function nowStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function buildReportMailUrl({ verificationId, targetUser, reasonKey, detail }) {
  const reason = REPORT_REASONS.find(r => r.key === reasonKey);
  const reasonLabel = reason?.label ?? reasonKey;
  const subject = `[Off-Mode 신고] verification #${verificationId} — ${reasonKey}`;
  const lines = [
    '아래 콘텐츠를 신고합니다.',
    '',
    `• verification ID: ${verificationId}`,
    `• 대상 사용자: ${targetUser ?? '(알 수 없음)'}`,
    `• 사유: ${reasonLabel} (${reasonKey})`,
    `• 신고 시각: ${nowStamp()}`,
  ];
  if (detail && detail.trim()) {
    lines.push('', '• 상세:', detail.trim());
  }
  lines.push('', '— Off-Mode 앱에서 자동 작성됨');
  const body = lines.join('\n');
  return `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function openReportMail(params) {
  const url = buildReportMailUrl(params);
  try {
    await Linking.openURL(url);
    return true;
  } catch (e) {
    console.warn('신고 메일 열기 실패:', e);
    Alert.alert(
      '메일 앱을 열 수 없어요',
      `직접 ${REPORT_EMAIL}로 신고해 주세요.`,
    );
    return false;
  }
}
