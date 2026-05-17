package com.offmode.boundedcontext.badge.api.v1;

import com.offmode.boundedcontext.badge.dto.response.BadgeResponse;
import com.offmode.boundedcontext.badge.service.BadgeService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/badges")
@RequiredArgsConstructor
public class BadgeController {

  private final BadgeService badgeService;

  // GET /api/v1/badges/me  — 전체 배지 정의 + 획득 여부
  @GetMapping("/me")
  public ResponseEntity<List<BadgeResponse>> getMyBadges(@AuthenticationPrincipal Long userId) {
    return ResponseEntity.ok(badgeService.getUserBadges(userId));
  }
}
