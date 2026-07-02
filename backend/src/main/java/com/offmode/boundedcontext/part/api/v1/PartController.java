package com.offmode.boundedcontext.part.api.v1;

import com.offmode.boundedcontext.part.dto.request.PartLayoutRequest;
import com.offmode.boundedcontext.part.dto.response.PartResponse;
import com.offmode.boundedcontext.part.service.PartService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/parts")
@RequiredArgsConstructor
public class PartController {

  private final PartService partService;

  // GET /api/v1/parts/me — 전체 파츠 정의 + 해금 상태 + 배치 정보
  @GetMapping("/me")
  public ResponseEntity<List<PartResponse>> getMyParts(@AuthenticationPrincipal Long userId) {
    return ResponseEntity.ok(partService.getUserParts(userId));
  }

  // PUT /api/v1/parts/layout — 캐릭터 꾸미기 레이아웃 전체 교체 저장
  @PutMapping("/layout")
  public ResponseEntity<List<PartResponse>> saveLayout(
      @AuthenticationPrincipal Long userId, @Valid @RequestBody PartLayoutRequest request) {
    return ResponseEntity.ok(partService.saveLayout(userId, request.getPlacements()));
  }
}
