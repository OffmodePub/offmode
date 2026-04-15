package com.offmode.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // GET /api/users/me
    @GetMapping("/me")
    public ResponseEntity<User> getMe(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(userService.getById(userId));
    }

    // GET /api/users/me/stats
    @GetMapping("/me/stats")
    public ResponseEntity<UserStatsDto> getStats(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(userService.getStats(userId));
    }

    // DELETE /api/users/me
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteMe(@AuthenticationPrincipal Long userId) {
        userService.deleteAccount(userId);
        return ResponseEntity.noContent().build();
    }

    // PUT /api/users/me
    // body: { "name": "...", "avatar": "...", "missionHour": 8, "missionMinute": 0, "autoRoulette": true }
    @PutMapping("/me")
    public ResponseEntity<User> updateMe(
            @AuthenticationPrincipal Long userId,
            @RequestBody Map<String, Object> body) {
        String  name          = (String)  body.get("name");
        String  avatar        = (String)  body.get("avatar");
        Integer missionHour   = body.get("missionHour")   != null ? ((Number) body.get("missionHour")).intValue()   : null;
        Integer missionMinute = body.get("missionMinute") != null ? ((Number) body.get("missionMinute")).intValue() : null;
        Boolean autoRoulette  = body.get("autoRoulette")  != null ? (Boolean) body.get("autoRoulette")             : null;
        User updated = userService.updateProfile(userId, name, avatar, missionHour, missionMinute, autoRoulette);
        return ResponseEntity.ok(updated);
    }
}
