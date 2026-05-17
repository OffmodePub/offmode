CREATE TABLE users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  provider VARCHAR(255) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(255) NOT NULL,
  level INTEGER NOT NULL,
  mission_hour INTEGER,
  mission_minute INTEGER,
  auto_roulette BIT,
  created_at DATETIME(6),
  PRIMARY KEY (id),
  CONSTRAINT uk_users_provider_provider_id UNIQUE (provider, provider_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE missions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  icon VARCHAR(255) NOT NULL,
  text VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_missions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  mission_icon VARCHAR(255) NOT NULL,
  mission_text VARCHAR(255) NOT NULL,
  mission_category VARCHAR(255) NOT NULL,
  status VARCHAR(255) NOT NULL,
  assigned_at DATETIME(6),
  verified_at DATETIME(6),
  PRIMARY KEY (id),
  CONSTRAINT fk_user_missions_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE verifications (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_mission_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  photo_url VARCHAR(255),
  caption VARCHAR(500),
  created_at DATETIME(6),
  PRIMARY KEY (id),
  CONSTRAINT fk_verifications_user_mission FOREIGN KEY (user_mission_id) REFERENCES user_missions (id),
  CONSTRAINT fk_verifications_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE verification_confirms (
  id BIGINT NOT NULL AUTO_INCREMENT,
  verification_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  confirmed_at DATETIME(6),
  PRIMARY KEY (id),
  CONSTRAINT uk_verification_confirms_verification_user UNIQUE (verification_id, user_id),
  CONSTRAINT fk_verification_confirms_verification FOREIGN KEY (verification_id) REFERENCES verifications (id),
  CONSTRAINT fk_verification_confirms_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reactions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  verification_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  created_at DATETIME(6),
  PRIMARY KEY (id),
  CONSTRAINT uk_reactions_verification_user_emoji UNIQUE (verification_id, user_id, emoji),
  CONSTRAINT fk_reactions_verification FOREIGN KEY (verification_id) REFERENCES verifications (id),
  CONSTRAINT fk_reactions_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_badges (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  badge_key VARCHAR(255) NOT NULL,
  earned_at DATETIME(6),
  PRIMARY KEY (id),
  CONSTRAINT uk_user_badges_user_badge_key UNIQUE (user_id, badge_key),
  CONSTRAINT fk_user_badges_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
