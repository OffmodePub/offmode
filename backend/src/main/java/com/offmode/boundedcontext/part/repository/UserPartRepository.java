package com.offmode.boundedcontext.part.repository;

import com.offmode.boundedcontext.part.entity.UserPart;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserPartRepository extends JpaRepository<UserPart, Long> {

  Optional<UserPart> findByUserId(Long userId);

  @Modifying
  @Query("DELETE FROM UserPart up WHERE up.user.id = :userId")
  void deleteByUserId(@Param("userId") Long userId);
}
