package com.offmode.boundedcontext.room.repository;

import com.offmode.boundedcontext.room.entity.RoomMember;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {

  Optional<RoomMember> findByRoomIdAndUserId(Long roomId, Long userId);

  Optional<RoomMember> findByIdAndRoomId(Long id, Long roomId);

  boolean existsByRoomIdAndUserId(Long roomId, Long userId);

  long countByRoomId(Long roomId);

  List<RoomMember> findByRoomIdOrderByJoinedAtAsc(Long roomId);

  @Query("SELECT m FROM RoomMember m JOIN FETCH m.room WHERE m.user.id = :userId")
  List<RoomMember> findWithRoomByUserId(@Param("userId") Long userId);
}
