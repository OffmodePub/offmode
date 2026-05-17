package com.offmode.boundedcontext.user.api.v1;

import com.offmode.boundedcontext.user.dto.request.UpdateUserProfileRequest;
import com.offmode.boundedcontext.user.dto.response.UserStatsDto;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
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
  // body: { "name": "...", "avatar": "...", "missionHour": 8, "missionMinute": 0, "autoRoulette":
  // true }
  @PutMapping("/me")
  public ResponseEntity<User> updateMe(
      @AuthenticationPrincipal Long userId, @Valid @RequestBody UpdateUserProfileRequest request) {
    User updated =
        userService.updateProfile(
            userId,
            request.getName(),
            request.getAvatar(),
            request.getMissionHour(),
            request.getMissionMinute(),
            request.getAutoRoulette());
    return ResponseEntity.ok(updated);
  }
}
