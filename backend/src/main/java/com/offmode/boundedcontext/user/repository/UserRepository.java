package com.offmode.boundedcontext.user.repository;

import com.offmode.boundedcontext.user.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByProviderAndProviderId(String provider, String providerId);

  // 같은 기기 토큰이 다른 계정에 남아 있으면 떼어낸다 (기기 공유·계정 전환 시 오배송 방지)
  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query(
      "UPDATE User u SET u.expoPushToken = null "
          + "WHERE u.expoPushToken = :token AND u.id <> :userId")
  void clearPushTokenForOtherUsers(@Param("token") String token, @Param("userId") Long userId);
}
