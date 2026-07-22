-- 사용자별 Expo 푸시 토큰 (콕 찌르기 등 원격 알림 발송용)
ALTER TABLE users ADD COLUMN expo_push_token VARCHAR(255) NULL;
