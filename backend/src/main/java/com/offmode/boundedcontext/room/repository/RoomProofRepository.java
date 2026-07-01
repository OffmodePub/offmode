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

  // 유저 누적 통계용: 유저가 올린 방 인증 총 개수 / 그중 VERIFIED 개수
  long countByUserId(Long userId);

  long countByUserIdAndStatus(Long userId, ProofStatus status);

  // 유저 연속 달성 일수 계산용: 유저가 VERIFIED 한 방 미션의 날짜들
  @Query(
      """
        SELECT DISTINCT p.roomMission.date
        FROM RoomProof p
        WHERE p.user.id = :userId AND p.status = :status
    """)
  List<LocalDate> findVerifiedDatesByUser(
      @Param("userId") Long userId, @Param("status") ProofStatus status);

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
