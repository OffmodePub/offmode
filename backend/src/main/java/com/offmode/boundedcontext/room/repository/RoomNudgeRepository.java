package com.offmode.boundedcontext.room.repository;

import com.offmode.boundedcontext.room.entity.RoomNudge;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomNudgeRepository extends JpaRepository<RoomNudge, Long> {

  boolean existsByRoomMissionIdAndFromUserIdAndToUserId(
      Long roomMissionId, Long fromUserId, Long toUserId);

  @Query(
      "select n.toUser.id from RoomNudge n "
          + "where n.roomMission.id = :missionId and n.fromUser.id = :fromUserId")
  List<Long> findToUserIdsByMissionAndFromUser(
      @Param("missionId") Long missionId, @Param("fromUserId") Long fromUserId);
}
