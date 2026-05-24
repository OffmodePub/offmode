package com.offmode.boundedcontext.feed.repository;

import com.offmode.boundedcontext.feed.entity.Reaction;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReactionRepository extends JpaRepository<Reaction, Long> {

  List<Reaction> findByVerificationIdAndUserId(Long verificationId, Long userId);

  List<Reaction> findByVerificationIdIn(List<Long> ids);

  List<Reaction> findByVerificationId(Long verificationId);

  // 유저가 남긴 reaction 삭제
  @Modifying
  @Query("DELETE FROM Reaction r WHERE r.user.id = :userId")
  void deleteByUserId(@Param("userId") Long userId);

  // 유저 미션의 verification에 달린 reaction 삭제
  @Modifying
  @Query("DELETE FROM Reaction r WHERE r.verification.userMission.user.id = :userId")
  void deleteByVerificationOwnerUserId(@Param("userId") Long userId);
}
