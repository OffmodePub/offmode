package com.offmode.boundedcontext.room.repository;

import com.offmode.boundedcontext.mission.types.MissionCategory;
import com.offmode.boundedcontext.room.entity.RoomProof;
import com.offmode.boundedcontext.room.types.ProofStatus;
import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomProofRepository extends JpaRepository<RoomProof, Long> {

  List<RoomProof> findByRoomMissionIdOrderByCreatedAtDesc(Long roomMissionId);

  // 회원 탈퇴 시: 유저가 올린 방 인증 삭제
  // (선행: 이 인증에 달린 reaction/confirm/report 를 먼저 지워야 FK 위반이 없다)
  @Modifying
  @Query("DELETE FROM RoomProof p WHERE p.user.id = :userId")
  void deleteByUserId(@Param("userId") Long userId);

  // confirm/리액션 직렬화용 행 락 — 같은 인증에 대한 동시 요청이 순서대로 처리되어
  // 임계치 이중 통과(이중 진급/뱃지)와 UNIQUE 위반 500을 막는다.
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT p FROM RoomProof p WHERE p.id = :id")
  Optional<RoomProof> findWithLockById(@Param("id") Long id);

  // 멤버가 나가 요구치가 줄었을 때 다시 판정할 대상.
  // id 오름차순으로 고정해 동시에 나가는 요청들이 같은 순서로 락을 잡게 한다 (데드락 방지).
  List<RoomProof> findByRoomMissionIdAndStatusOrderByIdAsc(Long roomMissionId, ProofStatus status);

  // 방 목록용: 미션별 VERIFIED 수를 한 번에 집계 (방 개수만큼 반복 호출하지 않는다)
  @Query(
      """
        SELECT p.roomMission.id, COUNT(p)
        FROM RoomProof p
        WHERE p.roomMission.id IN :missionIds AND p.status = :status
        GROUP BY p.roomMission.id
    """)
  List<Object[]> countRowsByRoomMissionIdInAndStatus(
      @Param("missionIds") List<Long> missionIds, @Param("status") ProofStatus status);

  // 방 상세용: 오늘 인증들을 업로더와 함께 한 번에 로드 (인증 건마다 유저 쿼리 없음)
  @Query(
      """
        SELECT p
        FROM RoomProof p
        JOIN FETCH p.user
        WHERE p.roomMission.id = :missionId
        ORDER BY p.createdAt DESC
    """)
  List<RoomProof> findWithUserByRoomMissionId(@Param("missionId") Long missionId);

  Optional<RoomProof> findByRoomMissionIdAndUserId(Long roomMissionId, Long userId);

  boolean existsByRoomMissionIdAndUserId(Long roomMissionId, Long userId);

  // 오늘 미션에 인증이 하나라도 올라왔는지 (인증 시작 후 미션 제목 수정 잠금용)
  boolean existsByRoomMissionId(Long roomMissionId);

  List<RoomProof> findByRoomMissionIdInOrderByCreatedAtAsc(List<Long> roomMissionIds);

  // 방의 오늘 미션에 대해 VERIFIED 한 멤버(유저) 수
  long countByRoomMissionIdAndStatus(Long roomMissionId, ProofStatus status);

  // 유저 누적 통계용: 유저가 올린 방 인증 총 개수 / 그중 VERIFIED 개수
  long countByUserId(Long userId);

  long countByUserIdAndStatus(Long userId, ProofStatus status);

  // 프로필 활동 기록용: 유저가 올린 방 인증(방 미션 날짜 최신순).
  // roomMission 을 fetch join 으로 함께 로드해 건당 추가 쿼리(N+1) 없이 사용한다.
  @Query(
      """
        SELECT p
        FROM RoomProof p
        JOIN FETCH p.roomMission rm
        WHERE p.user.id = :userId
        ORDER BY rm.date DESC, p.id DESC
    """)
  List<RoomProof> findHistoryByUser(@Param("userId") Long userId, Pageable pageable);

  // 내 기록 모아보기용: 기간 내 유저가 올린 방 인증 (모든 방).
  // roomMission·room 을 fetch join 으로 함께 로드해 건당 추가 쿼리(N+1) 없이 사용한다.
  @Query(
      """
        SELECT p
        FROM RoomProof p
        JOIN FETCH p.roomMission rm
        JOIN FETCH rm.room
        WHERE p.user.id = :userId AND rm.date BETWEEN :start AND :end
        ORDER BY rm.date DESC, p.createdAt ASC
    """)
  List<RoomProof> findMyHistoryBetween(
      @Param("userId") Long userId, @Param("start") LocalDate start, @Param("end") LocalDate end);

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
