-- 기본 미션 데이터 (중복 방지)
MERGE INTO missions (id, icon, text, category)
KEY(id)
VALUES
  (1,  '🪟', '창문 열고 하늘 사진 찍기',    'Vitality' ),
  (2,  '🚶', '30분 산책하기',               'Energy'   ),
  (3,  '📖', '책 10페이지 읽기',             'Intellect'),
  (4,  '☕', '카페 없이 집에서 커피 만들기', 'Vitality' ),
  (5,  '📝', '일기 한 줄 쓰기',              'Intellect'),
  (6,  '🎵', '새로운 음악 한 곡 듣기',       'Energy'   ),
  (7,  '🌱', '식물에 물 주기',               'Vitality' ),
  (8,  '🧘', '10분 명상하기',                'Intellect'),
  (9,  '✉️', '가족에게 안부 문자 보내기',    'Energy'   ),
  (10, '🌅', '일출 또는 일몰 감상하기',      'Vitality' ),
  (11, '🍳', '직접 요리해서 먹기',           'Energy'   ),
  (12, '🚫', '1시간 SNS 없이 지내기',        'Intellect');
