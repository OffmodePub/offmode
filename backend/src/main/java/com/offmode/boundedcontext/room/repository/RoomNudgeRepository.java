package com.offmode.boundedcontext.room.repository;

import com.offmode.boundedcontext.room.entity.RoomNudge;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomNudgeRepository extends JpaRepository<RoomNudge, Long> {

  boolean existsByRoomMissionIdAndFromUserIdAndToUserId(
      Long roomMissionId, Long fromUserId, Long toUserId);

  // 회원 탈퇴 시: 유저가 보냈거나 받은 콕찌르기 모두 삭제
  @Modifying
  @Query("DELETE FROM RoomNudge n WHERE n.fromUser.id = :userId OR n.toUser.id = :userId")
  void deleteAllByUser(@Param("userId") Long userId);

  @Query(
      "select n.toUser.id from RoomNudge n "
          + "where n.roomMission.id = :missionId and n.fromUser.id = :fromUserId")
  List<Long> findToUserIdsByMissionAndFromUser(
      @Param("missionId") Long missionId, @Param("fromUserId") Long fromUserId);
}
