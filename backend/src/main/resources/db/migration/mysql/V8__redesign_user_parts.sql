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

-- 4) NOT NULL 전환 + 파츠당 1개 유니크 추가
ALTER TABLE user_parts MODIFY COLUMN part_key VARCHAR(255) NOT NULL;
ALTER TABLE user_parts MODIFY COLUMN pos_x DOUBLE NOT NULL;
ALTER TABLE user_parts MODIFY COLUMN pos_y DOUBLE NOT NULL;
ALTER TABLE user_parts MODIFY COLUMN scale DOUBLE NOT NULL;
ALTER TABLE user_parts MODIFY COLUMN rotation DOUBLE NOT NULL;
ALTER TABLE user_parts MODIFY COLUMN z_index INT NOT NULL;
ALTER TABLE user_parts ADD CONSTRAINT uk_user_parts_user_part UNIQUE (user_id, part_key);

-- 5) 기존 유니크/컬럼 제거
-- fk_user_parts_user(user_id)가 user_id 선두 인덱스를 요구하므로,
-- uk_user_parts_user_part(user_id, part_key)를 먼저 추가한 뒤에야 기존 인덱스를 삭제할 수 있다 (MySQL errno 1553)
ALTER TABLE user_parts DROP INDEX uk_user_parts_user_id;
ALTER TABLE user_parts DROP COLUMN equipped_key;
