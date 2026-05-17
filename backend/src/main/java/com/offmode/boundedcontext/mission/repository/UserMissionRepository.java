package com.offmode.boundedcontext.mission.repository;

import com.offmode.boundedcontext.mission.dto.response.UserMissionDto;
import com.offmode.boundedcontext.mission.entity.UserMission;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserMissionRepository extends JpaRepository<UserMission, Long> {

  Optional<UserMission> findFirstByUserIdAndAssignedAtBetweenOrderByAssignedAtDesc(
      Long userId, LocalDateTime start, LocalDateTime end);

  List<UserMission> findByUserIdOrderByAssignedAtDesc(Long userId);

  boolean existsByUserId(Long userId);

  long countByUserIdAndStatus(Long userId, String status);

  long countByUserIdAndStatusAndMissionCategory(Long userId, String status, String category);

  // 글로벌 통계 (전체 유저)
  long countByStatus(String status);

  @Query("SELECT COUNT(DISTINCT um.user.id) FROM UserMission um WHERE um.assignedAt >= :since")
  long countDistinctUsersSince(@Param("since") LocalDateTime since);

  // 카테고리 내 미션 텍스트 검색 (하늘 수집가용)
  @Query(
      "SELECT COUNT(um) FROM UserMission um WHERE um.user.id = :userId AND um.status = 'verified' AND um.missionText LIKE %:keyword%")
  long countVerifiedByTextKeyword(@Param("userId") Long userId, @Param("keyword") String keyword);

  // 시간대별 인증 수 (새벽/오후/저녁)
  @Query(
      "SELECT COUNT(um) FROM UserMission um WHERE um.user.id = :userId AND um.status = 'verified' AND HOUR(um.verifiedAt) >= :fromHour AND HOUR(um.verifiedAt) < :toHour")
  long countVerifiedByHourRange(
      @Param("userId") Long userId, @Param("fromHour") int fromHour, @Param("toHour") int toHour);

  // 연속 달성 계산용: 인증된 미션의 verifiedAt 목록 (오름차순) - Java에서 LocalDate 추출
  @Query(
      "SELECT um.verifiedAt FROM UserMission um WHERE um.user.id = :userId AND um.status = 'verified' ORDER BY um.verifiedAt ASC")
  List<java.time.LocalDateTime> findVerifiedDateTimes(@Param("userId") Long userId);

  // 오늘 미션 + 인증 사진/캡션 포함
  @Query(
      """
        SELECT new com.offmode.boundedcontext.mission.dto.response.UserMissionDto(
            um.id, um.missionIcon, um.missionText, um.missionCategory,
            um.status, um.assignedAt, um.verifiedAt, v.photoUrl, v.caption
        )
        FROM UserMission um
        LEFT JOIN com.offmode.boundedcontext.feed.entity.Verification v ON v.userMission = um
        WHERE um.user.id = :userId AND um.assignedAt >= :start AND um.assignedAt < :end
        ORDER BY um.assignedAt DESC
    """)
  List<UserMissionDto> findTodayWithPhoto(
      @Param("userId") Long userId,
      @Param("start") LocalDateTime start,
      @Param("end") LocalDateTime end);

  // 가중치 계산용: 유저가 수행한 미션 텍스트별 가장 최근 assignedAt
  @Query(
      "SELECT um.missionText, MAX(um.assignedAt) FROM UserMission um WHERE um.user.id = :userId GROUP BY um.missionText")
  List<Object[]> findLatestAssignedAtPerMissionText(@Param("userId") Long userId);

  // 히스토리 + 인증 사진 포함
  @Query(
      """
        SELECT new com.offmode.boundedcontext.mission.dto.response.UserMissionDto(
            um.id, um.missionIcon, um.missionText, um.missionCategory,
            um.status, um.assignedAt, um.verifiedAt, v.photoUrl, v.caption
        )
        FROM UserMission um
        LEFT JOIN com.offmode.boundedcontext.feed.entity.Verification v ON v.userMission = um
        WHERE um.user.id = :userId
        ORDER BY um.assignedAt DESC
    """)
  List<UserMissionDto> findHistoryWithPhoto(@Param("userId") Long userId);

  @Modifying
  @Query("DELETE FROM UserMission um WHERE um.user.id = :userId")
  void deleteByUserId(@Param("userId") Long userId);
}
