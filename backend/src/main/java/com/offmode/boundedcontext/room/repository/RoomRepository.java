package com.offmode.boundedcontext.room.repository;

import com.offmode.boundedcontext.room.entity.Room;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, Long> {

  Optional<Room> findByInviteCode(String inviteCode);

  boolean existsByInviteCode(String inviteCode);
}
