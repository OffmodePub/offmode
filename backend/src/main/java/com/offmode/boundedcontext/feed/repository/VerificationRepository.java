package com.offmode.boundedcontext.feed.repository;

import com.offmode.boundedcontext.feed.dto.response.FeedItemResponse;
import com.offmode.boundedcontext.feed.entity.Verification;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VerificationRepository extends JpaRepository<Verification, Long> {

  boolean existsByUserMissionId(Long userMissionId);

  // confirm/react 직렬화용 행 락 — 같은 인증에 대한 동시 요청이 순서대로 처리되어
  // 임계치 이중 통과(이중 레벨업/뱃지)와 UNIQUE 위반 500을 막는다.
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT v FROM Verification v WHERE v.id = :id")
  Optional<Verification> findWithLockById(@Param("id") Long id);

  @Query(
      """
        SELECT new com.offmode.boundedcontext.feed.dto.response.FeedItemResponse(
            v.id, v.photoUrl, v.caption, v.createdAt,
            u.name, u.avatar, u.level,
            um.missionIcon, um.missionText, um.missionCategory,
            (SELECT COUNT(vc) FROM VerificationConfirm vc WHERE vc.verification = v),
            (SELECT COUNT(vc) > 0 FROM VerificationConfirm vc WHERE vc.verification = v AND vc.user.id = :userId),
            (v.user.id = :userId),
            null
        )
        FROM Verification v
        JOIN v.user u
        JOIN v.userMission um
        WHERE um.missionText = :missionText
        ORDER BY v.createdAt DESC
    """)
  List<FeedItemResponse> findFeedItems(
      Pageable pageable, @Param("userId") Long userId, @Param("missionText") String missionText);

  // 유저의 verification 삭제 (user_id 기준)
  @Modifying
  @Query("DELETE FROM Verification v WHERE v.user.id = :userId")
  void deleteByUserId(@Param("userId") Long userId);
}
