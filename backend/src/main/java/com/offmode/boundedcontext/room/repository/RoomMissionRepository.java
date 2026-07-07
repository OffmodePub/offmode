package com.offmode.boundedcontext.room.repository;

import com.offmode.boundedcontext.room.entity.RoomMission;
import com.offmode.boundedcontext.room.types.MissionSource;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomMissionRepository extends JpaRepository<RoomMission, Long> {

  Optional<RoomMission> findByRoomIdAndDate(Long roomId, LocalDate date);

  // 지난 미션 후보용: 방에서 직접 입력한(자유입력 = 미분류) 미션을 최신순으로 조회
  List<RoomMission> findByRoomIdAndSourceAndCategoryIsNullOrderByDateDesc(
      Long roomId, MissionSource source);

  // 방 목록용: 여러 방의 오늘 미션을 한 번에 조회
  List<RoomMission> findByRoomIdInAndDate(List<Long> roomIds, LocalDate date);

  List<RoomMission> findByRoomIdAndDateBetweenOrderByDateDesc(
      Long roomId, LocalDate start, LocalDate end);
}
