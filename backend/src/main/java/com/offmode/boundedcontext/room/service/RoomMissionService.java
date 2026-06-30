package com.offmode.boundedcontext.room.service;

import com.offmode.boundedcontext.mission.entity.Mission;
import com.offmode.boundedcontext.mission.repository.MissionRepository;
import com.offmode.boundedcontext.room.dto.request.SetRoomMissionRequest;
import com.offmode.boundedcontext.room.dto.response.MissionCandidateResponse;
import com.offmode.boundedcontext.room.dto.response.RoomMissionResponse;
import com.offmode.boundedcontext.room.entity.Room;
import com.offmode.boundedcontext.room.entity.RoomMission;
import com.offmode.boundedcontext.room.repository.RoomMissionRepository;
import com.offmode.boundedcontext.room.types.MissionSource;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.status.ErrorStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomMissionService {

  private final RoomMissionRepository missionRepository;
  private final MissionRepository masterMissionRepository;
  private final RoomService roomService;

  @Transactional(readOnly = true)
  public List<MissionCandidateResponse> getCandidates(Long userId, Long roomId) {
    roomService.getRoomOrThrow(roomId);
    roomService.getMembershipOrThrow(roomId, userId);
    return masterMissionRepository.findAll().stream().map(MissionCandidateResponse::from).toList();
  }

  @Transactional
  public RoomMissionResponse setTodayMission(
      Long userId, Long roomId, SetRoomMissionRequest request) {
    Room room = roomService.getRoomOrThrow(roomId);
    roomService.getMembershipOrThrow(roomId, userId);

    LocalDate today = LocalDate.now();
    if (missionRepository.findByRoomIdAndDate(roomId, today).isPresent()) {
      throw new BusinessException(ErrorStatus.ROOM_MISSION_ALREADY_SET);
    }

    String icon;
    String title;
    if (request.getSource() == MissionSource.RANDOM) {
      Mission picked = pickRandomMission();
      icon = picked.getIcon();
      title = picked.getText();
    } else if (request.getMissionId() != null) {
      Mission picked =
          masterMissionRepository
              .findById(request.getMissionId())
              .orElseThrow(() -> new BusinessException(ErrorStatus.MISSION_NOT_FOUND));
      icon = picked.getIcon();
      title = picked.getText();
    } else {
      if (request.getTitle() == null || request.getTitle().isBlank()) {
        throw new BusinessException(ErrorStatus.BAD_REQUEST);
      }
      title = request.getTitle();
      icon = request.getIcon() == null || request.getIcon().isBlank() ? "🎯" : request.getIcon();
    }

    RoomMission saved =
        missionRepository.save(
            RoomMission.builder()
                .room(room)
                .date(today)
                .icon(icon)
                .title(title)
                .source(request.getSource())
                .build());

    return RoomMissionResponse.from(saved);
  }

  private Mission pickRandomMission() {
    List<Mission> pool = masterMissionRepository.findAll();
    if (pool.isEmpty()) {
      throw new BusinessException(ErrorStatus.MISSION_NOT_FOUND);
    }
    return pool.get(ThreadLocalRandom.current().nextInt(pool.size()));
  }
}
