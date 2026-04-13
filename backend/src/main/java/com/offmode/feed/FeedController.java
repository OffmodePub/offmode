package com.offmode.feed;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feed")
@RequiredArgsConstructor
public class FeedController {

    private final FeedService feedService;

    // POST /api/feed/verify
    // multipart/form-data: photo (file), userMissionId, caption
    @PostMapping("/verify")
    public ResponseEntity<Verification> verify(
            @AuthenticationPrincipal Long userId,
            @RequestParam Long userMissionId,
            @RequestParam(required = false) MultipartFile photo,
            @RequestParam(required = false) String caption) throws Exception {
        return ResponseEntity.ok(feedService.verify(userId, userMissionId, photo, caption));
    }

    // GET /api/feed/stats - 커뮤니티 통계
    @GetMapping("/stats")
    public ResponseEntity<FeedStatsDto> getStats(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(feedService.getStats(userId));
    }

    // POST /api/feed/{id}/react - 리액션 토글  body: { "emoji": "🔥" }
    @PostMapping("/{id}/react")
    public ResponseEntity<Void> react(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        feedService.react(userId, id, body.get("emoji"));
        return ResponseEntity.ok().build();
    }

    // POST /api/feed/{id}/confirm - 피어 인증 (다른 사람의 인증 확인)
    @PostMapping("/{id}/confirm")
    public ResponseEntity<Void> confirm(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        feedService.confirm(userId, id);
        return ResponseEntity.ok().build();
    }

    // GET /api/feed?page=0&size=20
    @GetMapping
    public ResponseEntity<List<FeedItemDto>> getFeed(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(feedService.getFeed(userId, page, size));
    }
}
