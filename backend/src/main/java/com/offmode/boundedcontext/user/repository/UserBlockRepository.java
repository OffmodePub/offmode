package com.offmode.boundedcontext.user.repository;

import com.offmode.boundedcontext.user.entity.UserBlock;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {

  boolean existsByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

  void deleteByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

  // 회원 탈퇴 시: 해당 유저가 blocker 이거나 blocked 인 모든 차단 행 정리 (users FK 제약 해소)
  @Modifying
  @Query("DELETE FROM UserBlock b WHERE b.blocker.id = :userId OR b.blocked.id = :userId")
  void deleteAllByUser(@Param("userId") Long userId);

  @Query("SELECT b.blocked.id FROM UserBlock b WHERE b.blocker.id = :blockerId")
  List<Long> findBlockedIdsByBlockerId(@Param("blockerId") Long blockerId);

  @Query(
      "SELECT b FROM UserBlock b JOIN FETCH b.blocked WHERE b.blocker.id = :blockerId"
          + " ORDER BY b.createdAt DESC")
  List<UserBlock> findWithBlockedByBlockerId(@Param("blockerId") Long blockerId);
}
