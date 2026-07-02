package com.offmode.boundedcontext.room.repository;

import com.offmode.boundedcontext.mission.types.MissionCategory;
import com.offmode.boundedcontext.room.entity.RoomProof;
import com.offmode.boundedcontext.room.types.ProofStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
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

  // 프로필 활동 기록용: 유저가 올린 방 인증 전체(최신순, 사진·상태·미션 포함)
  List<RoomProof> findByUserIdOrderByCreatedAtDesc(Long userId);

  // 카테고리별 방 인증 수 (WALKER/BEAUTY_CURATOR/LOCAL_HIPSTER 배지 + 카테고리 통계용).
  // roomMission.category 가 null 인 인증은 어떤 카테고리에도 잡히지 않는다.
  long countByUserIdAndStatusAndRoomMissionCategory(
      Long userId, ProofStatus status, MissionCategory category);

  // 키워드 배지(예: "하늘")용 — 방 미션 제목에 키워드가 포함된 인증 수
  long countByUserIdAndStatusAndRoomMissionTitleContaining(
      Long userId, ProofStatus status, String keyword);

  // 시간대 배지용 — VERIFIED 방 인증의 생성 시각 목록(시(hour) 필터는 Java에서 수행)
  @Query("SELECT p.createdAt FROM RoomProof p WHERE p.user.id = :userId AND p.status = :status")
  List<LocalDateTime> findCreatedAtByUserIdAndStatus(
      @Param("userId") Long userId, @Param("status") ProofStatus status);

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
