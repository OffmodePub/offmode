package com.offmode.boundedcontext.room.repository;

import com.offmode.boundedcontext.room.entity.RoomMission;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomMissionRepository extends JpaRepository<RoomMission, Long> {

  Optional<RoomMission> findByRoomIdAndDate(Long roomId, LocalDate date);

  List<RoomMission> findByRoomIdAndDateBetweenOrderByDateDesc(
      Long roomId, LocalDate start, LocalDate end);
}
