package com.offmode.boundedcontext.mission.api.v1;

import com.offmode.boundedcontext.mission.dto.request.SetTodayMissionRequest;
import com.offmode.boundedcontext.mission.dto.response.MissionWeightDto;
import com.offmode.boundedcontext.mission.dto.response.UserMissionDto;
import com.offmode.boundedcontext.mission.entity.Mission;
import com.offmode.boundedcontext.mission.entity.UserMission;
import com.offmode.boundedcontext.mission.service.MissionService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/missions")
@RequiredArgsConstructor
public class MissionController {

  private final MissionService missionService;

  // GET /api/missions/today
  @GetMapping("/today")
  public ResponseEntity<UserMissionDto> today(@AuthenticationPrincipal Long userId) {
    UserMissionDto mission = missionService.getTodayMissionDto(userId);
    if (mission == null) return ResponseEntity.noContent().build();
    return ResponseEntity.ok(mission);
  }

  // POST /api/missions/today  body: { "icon": "...", "text": "...", "category": "..." }
  @PostMapping("/today")
  public ResponseEntity<UserMission> setToday(
      @AuthenticationPrincipal Long userId, @Valid @RequestBody SetTodayMissionRequest request) {
    UserMission mission =
        missionService.setTodayMission(
            userId, request.getIcon(), request.getText(), request.getCategory());
    return ResponseEntity.ok(mission);
  }

  // GET /api/missions/history
  @GetMapping("/history")
  public ResponseEntity<List<UserMissionDto>> history(@AuthenticationPrincipal Long userId) {
    return ResponseEntity.ok(missionService.getHistory(userId));
  }

  // GET /api/missions/pool
  @GetMapping("/pool")
  public ResponseEntity<List<Mission>> pool() {
    return ResponseEntity.ok(missionService.getPool());
  }

  // GET /api/missions/weighted-pool
  // 사용자의 최근 수행 이력 기반으로 weight 가 낮은 미션은 룰렛에서 뽑힐 확률이 낮음
  @GetMapping("/weighted-pool")
  public ResponseEntity<List<MissionWeightDto>> weightedPool(@AuthenticationPrincipal Long userId) {
    return ResponseEntity.ok(missionService.getWeightedPool(userId));
  }
}
