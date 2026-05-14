package com.offmode.boundedcontext.feed.out.repository;

import com.offmode.boundedcontext.feed.domain.entity.Reaction;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReactionRepository extends JpaRepository<Reaction, Long> {

  Optional<Reaction> findByVerificationIdAndUserIdAndEmoji(
      Long verificationId, Long userId, String emoji);

  // 여러 인증에 대한 리액션 요약 (emoji별 count + 내가 눌렀는지)
  @Query(
      """
        SELECT r.verification.id, r.emoji,
               COUNT(r),
               SUM(CASE WHEN r.user.id = :userId THEN 1 ELSE 0 END)
        FROM Reaction r
        WHERE r.verification.id IN :ids
        GROUP BY r.verification.id, r.emoji
        ORDER BY r.verification.id, COUNT(r) DESC
    """)
  List<Object[]> findSummaries(@Param("ids") List<Long> ids, @Param("userId") Long userId);

  // 유저가 남긴 reaction 삭제
  @Modifying
  @Query("DELETE FROM Reaction r WHERE r.user.id = :userId")
  void deleteByUserId(@Param("userId") Long userId);

  // 유저 미션의 verification에 달린 reaction 삭제
  @Modifying
  @Query("DELETE FROM Reaction r WHERE r.verification.userMission.user.id = :userId")
  void deleteByVerificationOwnerUserId(@Param("userId") Long userId);
}
