CREATE TABLE user_parts (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  equipped_key VARCHAR(255),
  updated_at DATETIME(6),
  PRIMARY KEY (id),
  CONSTRAINT uk_user_parts_user_id UNIQUE (user_id),
  CONSTRAINT fk_user_parts_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
