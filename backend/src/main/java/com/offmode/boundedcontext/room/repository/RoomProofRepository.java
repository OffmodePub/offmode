package com.offmode.boundedcontext.room.repository;

import com.offmode.boundedcontext.room.entity.RoomProof;
import com.offmode.boundedcontext.room.types.ProofStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomProofRepository extends JpaRepository<RoomProof, Long> {

  List<RoomProof> findByRoomMissionIdOrderByCreatedAtDesc(Long roomMissionId);

  Optional<RoomProof> findByRoomMissionIdAndUserId(Long roomMissionId, Long userId);

  boolean existsByRoomMissionIdAndUserId(Long roomMissionId, Long userId);

  List<RoomProof> findByRoomMissionIdInOrderByCreatedAtAsc(List<Long> roomMissionIds);

  // 방의 오늘 미션에 대해 VERIFIED 한 멤버(유저) 수
  long countByRoomMissionIdAndStatus(Long roomMissionId, ProofStatus status);

  // 연속 달성 일수 계산용: 1건 이상 VERIFIED 가 존재하는 날짜들 (최신순)
  @Query(
      """
        SELECT DISTINCT p.roomMission.date
        FROM RoomProof p
        WHERE p.roomMission.room.id = :roomId AND p.status = :status
        ORDER BY p.roomMission.date DESC
    """)
  List<LocalDate> findVerifiedDates(
      @Param("roomId") Long roomId, @Param("status") ProofStatus status);
}
