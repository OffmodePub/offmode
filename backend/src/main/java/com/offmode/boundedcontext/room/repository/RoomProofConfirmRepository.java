package com.offmode.boundedcontext.room.repository;

import com.offmode.boundedcontext.room.entity.RoomProofConfirm;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomProofConfirmRepository extends JpaRepository<RoomProofConfirm, Long> {

  boolean existsByRoomProofIdAndUserId(Long roomProofId, Long userId);

  long countByRoomProofId(Long roomProofId);
}
