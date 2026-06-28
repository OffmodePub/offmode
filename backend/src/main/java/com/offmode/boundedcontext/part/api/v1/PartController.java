package com.offmode.boundedcontext.part.api.v1;

import com.offmode.boundedcontext.part.dto.request.PartEquipRequest;
import com.offmode.boundedcontext.part.dto.response.PartResponse;
import com.offmode.boundedcontext.part.service.PartService;
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

  // GET /api/v1/parts/me — 전체 파츠 정의 + 해금/장착 상태
  @GetMapping("/me")
  public ResponseEntity<List<PartResponse>> getMyParts(@AuthenticationPrincipal Long userId) {
    return ResponseEntity.ok(partService.getUserParts(userId));
  }

  // PUT /api/v1/parts/equip — 파츠 장착/해제 (equippedKey == null 이면 해제)
  @PutMapping("/equip")
  public ResponseEntity<List<PartResponse>> equip(
      @AuthenticationPrincipal Long userId, @RequestBody PartEquipRequest request) {
    return ResponseEntity.ok(partService.equip(userId, request.getEquippedKey()));
  }
}
