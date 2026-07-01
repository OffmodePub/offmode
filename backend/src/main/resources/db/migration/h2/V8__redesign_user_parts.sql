-- user_parts 재설계: 유저당 1행(단일 장착) → 유저당 N행(자유 배치된 파츠).
-- 각 행 = 배치된 파츠 1개.

-- 1) 배치 정보 컬럼 추가 (우선 nullable 로 추가 후 이관 완료 시점에 NOT NULL 전환)
ALTER TABLE user_parts ADD COLUMN part_key VARCHAR(255);
ALTER TABLE user_parts ADD COLUMN pos_x DOUBLE;
ALTER TABLE user_parts ADD COLUMN pos_y DOUBLE;
ALTER TABLE user_parts ADD COLUMN scale DOUBLE;
ALTER TABLE user_parts ADD COLUMN rotation DOUBLE;
ALTER TABLE user_parts ADD COLUMN z_index INT;

-- 2) 기존 장착 파츠를 중앙(0.5, 0.5) 기본 배치로 이관
UPDATE user_parts
SET part_key = equipped_key,
    pos_x = 0.5,
    pos_y = 0.5,
    scale = 1,
    rotation = 0,
    z_index = 0
WHERE equipped_key IS NOT NULL;

-- 3) 장착 이력이 없던 빈 행 제거
DELETE FROM user_parts WHERE equipped_key IS NULL;

-- 4) 기존 유니크/컬럼 제거
ALTER TABLE user_parts DROP CONSTRAINT uk_user_parts_user_id;
ALTER TABLE user_parts DROP COLUMN equipped_key;

-- 5) NOT NULL 전환 + 파츠당 1개 유니크 재설정
ALTER TABLE user_parts ALTER COLUMN part_key SET NOT NULL;
ALTER TABLE user_parts ALTER COLUMN pos_x SET NOT NULL;
ALTER TABLE user_parts ALTER COLUMN pos_y SET NOT NULL;
ALTER TABLE user_parts ALTER COLUMN scale SET NOT NULL;
ALTER TABLE user_parts ALTER COLUMN rotation SET NOT NULL;
ALTER TABLE user_parts ALTER COLUMN z_index SET NOT NULL;
ALTER TABLE user_parts ADD CONSTRAINT uk_user_parts_user_part UNIQUE (user_id, part_key);
