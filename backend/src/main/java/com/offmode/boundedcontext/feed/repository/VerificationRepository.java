package com.offmode.boundedcontext.feed.out.repository;

import com.offmode.boundedcontext.feed.app.dto.response.FeedItemDto;
import com.offmode.boundedcontext.feed.domain.entity.Verification;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VerificationRepository extends JpaRepository<Verification, Long> {

  boolean existsByUserMissionId(Long userMissionId);

  @Query(
      """
        SELECT new com.offmode.boundedcontext.feed.app.dto.response.FeedItemDto(
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
  List<FeedItemDto> findFeedItems(
      Pageable pageable, @Param("userId") Long userId, @Param("missionText") String missionText);

  // 유저의 verification 삭제 (user_id 기준)
  @Modifying
  @Query("DELETE FROM Verification v WHERE v.user.id = :userId")
  void deleteByUserId(@Param("userId") Long userId);
}
