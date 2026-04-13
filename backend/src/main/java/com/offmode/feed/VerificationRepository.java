package com.offmode.feed;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VerificationRepository extends JpaRepository<Verification, Long> {

    @Query("""
        SELECT new com.offmode.feed.FeedItemDto(
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
        ORDER BY v.createdAt DESC
    """)
    List<FeedItemDto> findFeedItems(Pageable pageable, @Param("userId") Long userId);
}
