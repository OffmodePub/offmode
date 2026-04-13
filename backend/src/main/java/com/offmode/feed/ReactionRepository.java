package com.offmode.feed;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReactionRepository extends JpaRepository<Reaction, Long> {

    Optional<Reaction> findByVerificationIdAndUserIdAndEmoji(Long verificationId, Long userId, String emoji);

    // 여러 인증에 대한 리액션 요약 (emoji별 count + 내가 눌렀는지)
    @Query("""
        SELECT r.verification.id, r.emoji,
               COUNT(r),
               SUM(CASE WHEN r.user.id = :userId THEN 1 ELSE 0 END)
        FROM Reaction r
        WHERE r.verification.id IN :ids
        GROUP BY r.verification.id, r.emoji
        ORDER BY r.verification.id, COUNT(r) DESC
    """)
    List<Object[]> findSummaries(@Param("ids") List<Long> ids, @Param("userId") Long userId);
}
