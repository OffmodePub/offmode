CREATE TABLE rooms (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  icon_key VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  invite_code VARCHAR(255),
  created_at DATETIME(6),
  PRIMARY KEY (id),
  CONSTRAINT uk_rooms_invite_code UNIQUE (invite_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE room_members (
  id BIGINT NOT NULL AUTO_INCREMENT,
  room_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role VARCHAR(255) NOT NULL,
  joined_at DATETIME(6),
  PRIMARY KEY (id),
  CONSTRAINT uk_room_members_room_user UNIQUE (room_id, user_id),
  CONSTRAINT fk_room_members_room FOREIGN KEY (room_id) REFERENCES rooms (id),
  CONSTRAINT fk_room_members_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE room_missions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  room_id BIGINT NOT NULL,
  mission_date DATE NOT NULL,
  title VARCHAR(255) NOT NULL,
  icon VARCHAR(255) NOT NULL,
  source VARCHAR(255) NOT NULL,
  created_at DATETIME(6),
  PRIMARY KEY (id),
  CONSTRAINT uk_room_missions_room_date UNIQUE (room_id, mission_date),
  CONSTRAINT fk_room_missions_room FOREIGN KEY (room_id) REFERENCES rooms (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE room_proofs (
  id BIGINT NOT NULL AUTO_INCREMENT,
  room_mission_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  photo_url VARCHAR(255),
  caption VARCHAR(500),
  status VARCHAR(255) NOT NULL,
  created_at DATETIME(6),
  PRIMARY KEY (id),
  CONSTRAINT uk_room_proofs_mission_user UNIQUE (room_mission_id, user_id),
  CONSTRAINT fk_room_proofs_mission FOREIGN KEY (room_mission_id) REFERENCES room_missions (id),
  CONSTRAINT fk_room_proofs_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE room_proof_confirms (
  id BIGINT NOT NULL AUTO_INCREMENT,
  room_proof_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  confirmed_at DATETIME(6),
  PRIMARY KEY (id),
  CONSTRAINT uk_room_proof_confirms_proof_user UNIQUE (room_proof_id, user_id),
  CONSTRAINT fk_room_proof_confirms_proof FOREIGN KEY (room_proof_id) REFERENCES room_proofs (id),
  CONSTRAINT fk_room_proof_confirms_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE room_reactions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  room_proof_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  emoji VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  created_at DATETIME(6),
  PRIMARY KEY (id),
  CONSTRAINT uk_room_reactions_proof_user_emoji UNIQUE (room_proof_id, user_id, emoji),
  CONSTRAINT fk_room_reactions_proof FOREIGN KEY (room_proof_id) REFERENCES room_proofs (id),
  CONSTRAINT fk_room_reactions_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
