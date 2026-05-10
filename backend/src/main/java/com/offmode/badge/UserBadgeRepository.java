package com.offmode.badge;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {

  List<UserBadge> findByUserId(Long userId);

  boolean existsByUserIdAndBadgeKey(Long userId, String badgeKey);

  default Set<String> findEarnedKeys(Long userId) {
    return findByUserId(userId).stream().map(UserBadge::getBadgeKey).collect(Collectors.toSet());
  }

  @Modifying
  @Query("DELETE FROM UserBadge ub WHERE ub.user.id = :userId")
  void deleteByUserId(@Param("userId") Long userId);
}
