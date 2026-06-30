package com.offmode.boundedcontext.room.repository;

import com.offmode.boundedcontext.room.entity.RoomReaction;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomReactionRepository extends JpaRepository<RoomReaction, Long> {

  List<RoomReaction> findByRoomProofIdAndUserId(Long roomProofId, Long userId);

  @Query(
      """
        SELECT r.roomProof.id, r.emoji, r.user.id
        FROM RoomReaction r
        WHERE r.roomProof.id = :proofId
    """)
  List<Object[]> findRowsByRoomProofId(@Param("proofId") Long proofId);

  @Query(
      """
        SELECT r.roomProof.id, r.emoji, r.user.id
        FROM RoomReaction r
        WHERE r.roomProof.id IN :proofIds
    """)
  List<Object[]> findRowsByRoomProofIdIn(@Param("proofIds") List<Long> proofIds);
}
