package com.offmode.boundedcontext.mission.in.api.v1;

import com.offmode.boundedcontext.mission.app.dto.response.MissionWeightDto;
import com.offmode.boundedcontext.mission.app.dto.response.UserMissionDto;
import com.offmode.boundedcontext.mission.app.service.MissionService;
import com.offmode.boundedcontext.mission.domain.entity.Mission;
import com.offmode.boundedcontext.mission.domain.entity.UserMission;
import java.util.List;
import java.util.Map;
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
      @AuthenticationPrincipal Long userId, @RequestBody Map<String, String> body) {
    UserMission mission =
        missionService.setTodayMission(
            userId, body.get("icon"), body.get("text"), body.get("category"));
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
