CREATE TABLE room_proof_reports (
  id BIGINT NOT NULL AUTO_INCREMENT,
  room_proof_id BIGINT NOT NULL,
  reporter_user_id BIGINT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  detail VARCHAR(500),
  created_at DATETIME(6),
  PRIMARY KEY (id),
  CONSTRAINT uk_room_proof_reports_proof_reporter UNIQUE (room_proof_id, reporter_user_id),
  CONSTRAINT fk_room_proof_reports_proof FOREIGN KEY (room_proof_id) REFERENCES room_proofs (id),
  CONSTRAINT fk_room_proof_reports_reporter FOREIGN KEY (reporter_user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
