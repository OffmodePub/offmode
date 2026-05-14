package com.offmode.boundedcontext.user.out.repository;

import com.offmode.boundedcontext.user.domain.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByProviderAndProviderId(String provider, String providerId);
}
