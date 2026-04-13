package com.offmode.feed;

import org.springframework.data.jpa.repository.JpaRepository;

public interface VerificationConfirmRepository extends JpaRepository<VerificationConfirm, Long> {

    long countByVerificationId(Long verificationId);

    boolean existsByVerificationIdAndUserId(Long verificationId, Long userId);
}
