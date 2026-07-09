package com.offmode.boundedcontext.room.repository;

import com.offmode.boundedcontext.room.entity.RoomProofReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomProofReportRepository extends JpaRepository<RoomProofReport, Long> {

  boolean existsByRoomProofIdAndReporterId(Long roomProofId, Long reporterId);

  // 회원 탈퇴 시: 유저가 신고한 행 삭제
  @Modifying
  @Query("DELETE FROM RoomProofReport r WHERE r.reporter.id = :userId")
  void deleteByReporterId(@Param("userId") Long userId);

  // 회원 탈퇴 시: 유저의 방 인증에 달린 신고 삭제 (room_proofs 삭제 전 선행)
  @Modifying
  @Query("DELETE FROM RoomProofReport r WHERE r.roomProof.user.id = :userId")
  void deleteByProofOwnerUserId(@Param("userId") Long userId);
}
