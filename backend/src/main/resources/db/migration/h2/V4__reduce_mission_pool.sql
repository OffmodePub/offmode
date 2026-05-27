-- 미션 풀을 카테고리당 균형 있게 9개로 축소 (issue #78)
-- Energy: 5, 11, 12
-- Intellect: 22, 29, 37
-- Vitality: 41, 83, 85
DELETE FROM missions WHERE id NOT IN (5, 11, 12, 22, 29, 37, 41, 83, 85);
