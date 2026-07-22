package com.offmode.boundedcontext.user.api.v1;

import com.offmode.boundedcontext.user.dto.request.UpdatePushTokenRequest;
import com.offmode.boundedcontext.user.dto.request.UpdateUserProfileRequest;
import com.offmode.boundedcontext.user.dto.response.BlockResponse;
import com.offmode.boundedcontext.user.dto.response.BlockedUserResponse;
import com.offmode.boundedcontext.user.dto.response.UserStatsResponse;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.service.BlockService;
import com.offmode.boundedcontext.user.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;
  private final BlockService blockService;

  // GET /api/v1/users/me
  @GetMapping("/me")
  public ResponseEntity<User> getMe(@AuthenticationPrincipal Long userId) {
    return ResponseEntity.ok(userService.getById(userId));
  }

  // GET /api/v1/users/me/stats
  @GetMapping("/me/stats")
  public ResponseEntity<UserStatsResponse> getStats(@AuthenticationPrincipal Long userId) {
    return ResponseEntity.ok(userService.getStats(userId));
  }

  // DELETE /api/v1/users/me
  @DeleteMapping("/me")
  public ResponseEntity<Void> deleteMe(@AuthenticationPrincipal Long userId) {
    userService.deleteAccount(userId);
    return ResponseEntity.noContent().build();
  }

  // PUT /api/v1/users/me
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

  // PUT /api/v1/users/me/push-token
  // body: { "token": "ExponentPushToken[...]" }  — token 이 비어 있으면 해제
  @PutMapping("/me/push-token")
  public ResponseEntity<Void> updatePushToken(
      @AuthenticationPrincipal Long userId, @Valid @RequestBody UpdatePushTokenRequest request) {
    userService.updatePushToken(userId, request.getToken());
    return ResponseEntity.noContent().build();
  }

  // POST /api/v1/users/{userId}/block  (userId = 차단 대상)
  @PostMapping("/{userId}/block")
  public ResponseEntity<BlockResponse> block(
      @AuthenticationPrincipal Long me, @PathVariable Long userId) {
    return ResponseEntity.ok(blockService.block(me, userId));
  }

  // DELETE /api/v1/users/{userId}/block (멱등)
  @DeleteMapping("/{userId}/block")
  public ResponseEntity<Void> unblock(@AuthenticationPrincipal Long me, @PathVariable Long userId) {
    blockService.unblock(me, userId);
    return ResponseEntity.noContent().build();
  }

  // GET /api/v1/users/me/blocks
  @GetMapping("/me/blocks")
  public ResponseEntity<List<BlockedUserResponse>> myBlocks(@AuthenticationPrincipal Long me) {
    return ResponseEntity.ok(blockService.listBlocked(me));
  }
}
