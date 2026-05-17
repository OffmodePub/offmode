package com.offmode.boundedcontext.feed.repository;

import com.offmode.boundedcontext.feed.entity.VerificationConfirm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VerificationConfirmRepository extends JpaRepository<VerificationConfirm, Long> {

  long countByVerificationId(Long verificationId);

  boolean existsByVerificationIdAndUserId(Long verificationId, Long userId);

  // 유저가 남긴 confirm 삭제
  @Modifying
  @Query("DELETE FROM VerificationConfirm vc WHERE vc.user.id = :userId")
  void deleteByUserId(@Param("userId") Long userId);

  // 유저 미션의 verification에 달린 confirm 삭제
  @Modifying
  @Query("DELETE FROM VerificationConfirm vc WHERE vc.verification.userMission.user.id = :userId")
  void deleteByVerificationOwnerUserId(@Param("userId") Long userId);
}
