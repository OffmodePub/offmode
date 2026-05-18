package com.offmode.boundedcontext.feed.api.v1;

import com.offmode.boundedcontext.feed.dto.request.ReactRequest;
import com.offmode.boundedcontext.feed.dto.response.FeedItemResponse;
import com.offmode.boundedcontext.feed.dto.response.FeedStatsResponse;
import com.offmode.boundedcontext.feed.dto.response.VerificationResponse;
import com.offmode.boundedcontext.feed.service.FeedService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/feed")
@RequiredArgsConstructor
public class FeedController {

  private final FeedService feedService;

  // POST /api/v1/feed/verify
  // multipart/form-data: photo (file), userMissionId, caption
  @PostMapping("/verify")
  public ResponseEntity<VerificationResponse> verify(
      @AuthenticationPrincipal Long userId,
      @RequestParam Long userMissionId,
      @RequestParam(required = false) MultipartFile photo,
      @RequestParam(required = false) String caption)
      throws Exception {
    return ResponseEntity.ok(
        VerificationResponse.from(feedService.verify(userId, userMissionId, photo, caption)));
  }

  // GET /api/v1/feed/stats - 커뮤니티 통계
  @GetMapping("/stats")
  public ResponseEntity<FeedStatsResponse> getStats(@AuthenticationPrincipal Long userId) {
    return ResponseEntity.ok(feedService.getStats(userId));
  }

  // POST /api/v1/feed/{id}/react - 리액션 토글  body: { "emoji": "🔥" }
  @PostMapping("/{id}/react")
  public ResponseEntity<Void> react(
      @AuthenticationPrincipal Long userId,
      @PathVariable Long id,
      @Valid @RequestBody ReactRequest request) {
    feedService.react(userId, id, request.getEmoji());
    return ResponseEntity.ok().build();
  }

  // POST /api/v1/feed/{id}/confirm - 피어 인증 (다른 사람의 인증 확인)
  @PostMapping("/{id}/confirm")
  public ResponseEntity<Void> confirm(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
    feedService.confirm(userId, id);
    return ResponseEntity.ok().build();
  }

  // GET /api/v1/feed?page=0&size=20
  @GetMapping
  public ResponseEntity<List<FeedItemResponse>> getFeed(
      @AuthenticationPrincipal Long userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return ResponseEntity.ok(feedService.getFeed(userId, page, size));
  }
}
