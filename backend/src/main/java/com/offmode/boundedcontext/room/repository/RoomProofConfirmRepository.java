package com.offmode.boundedcontext.room.repository;

import com.offmode.boundedcontext.room.entity.RoomProofConfirm;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomProofConfirmRepository extends JpaRepository<RoomProofConfirm, Long> {

  boolean existsByRoomProofIdAndUserId(Long roomProofId, Long userId);

  long countByRoomProofId(Long roomProofId);

  // 회원 탈퇴 시: 유저가 남긴 confirm 삭제
  @Modifying
  @Query("DELETE FROM RoomProofConfirm c WHERE c.user.id = :userId")
  void deleteByUserId(@Param("userId") Long userId);

  // 회원 탈퇴 시: 유저의 방 인증에 달린 confirm 삭제 (room_proofs 삭제 전 선행)
  @Modifying
  @Query("DELETE FROM RoomProofConfirm c WHERE c.roomProof.user.id = :userId")
  void deleteByProofOwnerUserId(@Param("userId") Long userId);

  // 방 상세용: 여러 인증의 confirm (proofId, userId) 행을 한 번에 조회해 애플리케이션에서 집계
  @Query(
      """
        SELECT c.roomProof.id, c.user.id
        FROM RoomProofConfirm c
        WHERE c.roomProof.id IN :proofIds
    """)
  List<Object[]> findRowsByRoomProofIdIn(@Param("proofIds") List<Long> proofIds);
}
