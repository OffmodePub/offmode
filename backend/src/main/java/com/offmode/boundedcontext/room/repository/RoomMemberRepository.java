package com.offmode.boundedcontext.room.repository;

import com.offmode.boundedcontext.room.entity.RoomMember;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {

  Optional<RoomMember> findByRoomIdAndUserId(Long roomId, Long userId);

  // 회원 탈퇴 시: 유저의 모든 방 멤버십 삭제 (owner 위임 처리 후 호출)
  @Modifying
  @Query("DELETE FROM RoomMember m WHERE m.user.id = :userId")
  void deleteByUserId(@Param("userId") Long userId);

  Optional<RoomMember> findByIdAndRoomId(Long id, Long roomId);

  boolean existsByRoomIdAndUserId(Long roomId, Long userId);

  long countByRoomId(Long roomId);

  List<RoomMember> findByRoomIdOrderByJoinedAtAsc(Long roomId);

  @Query("SELECT m FROM RoomMember m JOIN FETCH m.room WHERE m.user.id = :userId")
  List<RoomMember> findWithRoomByUserId(@Param("userId") Long userId);

  // 방 목록용: 방별 멤버 수를 한 번에 집계
  @Query(
      """
        SELECT m.room.id, COUNT(m)
        FROM RoomMember m
        WHERE m.room.id IN :roomIds
        GROUP BY m.room.id
    """)
  List<Object[]> countRowsByRoomIdIn(@Param("roomIds") List<Long> roomIds);

  // 방 상세용: 멤버를 유저와 함께 한 번에 로드 (멤버마다 유저 쿼리 없음)
  @Query(
      """
        SELECT m
        FROM RoomMember m
        JOIN FETCH m.user
        WHERE m.room.id = :roomId
        ORDER BY m.joinedAt ASC
    """)
  List<RoomMember> findWithUserByRoomIdOrderByJoinedAtAsc(@Param("roomId") Long roomId);
}
