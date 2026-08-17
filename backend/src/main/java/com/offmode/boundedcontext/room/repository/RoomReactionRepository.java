package com.offmode.boundedcontext.room.repository;

import com.offmode.boundedcontext.room.entity.RoomReaction;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomReactionRepository extends JpaRepository<RoomReaction, Long> {

  List<RoomReaction> findByRoomProofIdAndUserId(Long roomProofId, Long userId);

  // 회원 탈퇴 시: 유저가 남긴 방 리액션 삭제
  @Modifying
  @Query("DELETE FROM RoomReaction r WHERE r.user.id = :userId")
  void deleteByUserId(@Param("userId") Long userId);

  // 회원 탈퇴 시: 유저의 방 인증에 달린 리액션 삭제 (room_proofs 삭제 전 선행)
  @Modifying
  @Query("DELETE FROM RoomReaction r WHERE r.roomProof.user.id = :userId")
  void deleteByProofOwnerUserId(@Param("userId") Long userId);

  // 배지(EMOJI_ARTIST): 내가 '다른 유저' 인증에 남긴 리액션 수.
  // 셀프 리액션은 토글 API가 막지 않으므로 여기서 제외한다.
  @Query(
      """
        SELECT COUNT(r)
        FROM RoomReaction r
        WHERE r.user.id = :userId AND r.roomProof.user.id <> :userId
    """)
  long countGivenToOthers(@Param("userId") Long userId);

  // 배지(REACTION_MASTER): 내 인증에 '남이' 남긴 리액션 수. 셀프 리액션 제외.
  @Query(
      """
        SELECT COUNT(r)
        FROM RoomReaction r
        WHERE r.roomProof.user.id = :userId AND r.user.id <> :userId
    """)
  long countReceivedFromOthers(@Param("userId") Long userId);

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
