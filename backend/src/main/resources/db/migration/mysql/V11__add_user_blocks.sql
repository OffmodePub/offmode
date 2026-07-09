CREATE TABLE user_blocks (
  id BIGINT NOT NULL AUTO_INCREMENT,
  blocker_user_id BIGINT NOT NULL,
  blocked_user_id BIGINT NOT NULL,
  created_at DATETIME(6),
  PRIMARY KEY (id),
  CONSTRAINT uk_user_blocks_blocker_blocked UNIQUE (blocker_user_id, blocked_user_id),
  CONSTRAINT fk_user_blocks_blocker FOREIGN KEY (blocker_user_id) REFERENCES users (id),
  CONSTRAINT fk_user_blocks_blocked FOREIGN KEY (blocked_user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
