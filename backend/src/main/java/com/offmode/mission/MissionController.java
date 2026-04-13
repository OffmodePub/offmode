package com.offmode.mission;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/missions")
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
            @AuthenticationPrincipal Long userId,
            @RequestBody Map<String, String> body) {
        UserMission mission = missionService.setTodayMission(
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
}
