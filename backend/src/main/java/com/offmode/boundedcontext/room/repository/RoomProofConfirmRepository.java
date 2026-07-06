package com.offmode.boundedcontext.room.repository;

import com.offmode.boundedcontext.room.entity.RoomProofConfirm;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomProofConfirmRepository extends JpaRepository<RoomProofConfirm, Long> {

  boolean existsByRoomProofIdAndUserId(Long roomProofId, Long userId);

  long countByRoomProofId(Long roomProofId);

  // 방 상세용: 여러 인증의 confirm (proofId, userId) 행을 한 번에 조회해 애플리케이션에서 집계
  @Query(
      """
        SELECT c.roomProof.id, c.user.id
        FROM RoomProofConfirm c
        WHERE c.roomProof.id IN :proofIds
    """)
  List<Object[]> findRowsByRoomProofIdIn(@Param("proofIds") List<Long> proofIds);
}
