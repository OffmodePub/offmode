package com.offmode.badge;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {

    List<UserBadge> findByUserId(Long userId);

    boolean existsByUserIdAndBadgeKey(Long userId, String badgeKey);

    default Set<String> findEarnedKeys(Long userId) {
        return findByUserId(userId).stream()
                .map(UserBadge::getBadgeKey)
                .collect(Collectors.toSet());
    }
}
