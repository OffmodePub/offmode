package com.offmode.boundedcontext.room.api.v1;

import com.offmode.boundedcontext.room.dto.request.CreateRoomRequest;
import com.offmode.boundedcontext.room.dto.request.JoinRoomRequest;
import com.offmode.boundedcontext.room.dto.request.RenameRoomRequest;
import com.offmode.boundedcontext.room.dto.request.ReportRequest;
import com.offmode.boundedcontext.room.dto.request.RoomReactRequest;
import com.offmode.boundedcontext.room.dto.request.SetRoomMissionRequest;
import com.offmode.boundedcontext.room.dto.request.UpdateRoomMissionTitleRequest;
import com.offmode.boundedcontext.room.dto.response.ConfirmResponse;
import com.offmode.boundedcontext.room.dto.response.MissionCandidateResponse;
import com.offmode.boundedcontext.room.dto.response.MyHistoryResponse;
import com.offmode.boundedcontext.room.dto.response.NudgeResponse;
import com.offmode.boundedcontext.room.dto.response.ProofReportResponse;
import com.offmode.boundedcontext.room.dto.response.RoomDetailResponse;
import com.offmode.boundedcontext.room.dto.response.RoomHistoryResponse;
import com.offmode.boundedcontext.room.dto.response.RoomListResponse;
import com.offmode.boundedcontext.room.dto.response.RoomMissionResponse;
import com.offmode.boundedcontext.room.dto.response.RoomProofResponse;
import com.offmode.boundedcontext.room.dto.response.RoomReactionSummaryResponse;
import com.offmode.boundedcontext.room.service.RoomMissionService;
import com.offmode.boundedcontext.room.service.RoomProofService;
import com.offmode.boundedcontext.room.service.RoomService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
public class RoomController {

  private final RoomService roomService;
  private final RoomMissionService roomMissionService;
  private final RoomProofService roomProofService;

  // ===== 방 =====

  // POST /api/v1/rooms - 방 생성
  @PostMapping
  public ResponseEntity<RoomDetailResponse> createRoom(
      @AuthenticationPrincipal Long userId, @Valid @RequestBody CreateRoomRequest request) {
    return ResponseEntity.ok(roomService.createRoom(userId, request));
  }

  // GET /api/v1/rooms - 내 방 목록
  @GetMapping
  public ResponseEntity<RoomListResponse> getMyRooms(@AuthenticationPrincipal Long userId) {
    return ResponseEntity.ok(roomService.getMyRooms(userId));
  }

  // POST /api/v1/rooms/join - 초대코드 참여
  @PostMapping("/join")
  public ResponseEntity<RoomDetailResponse> join(
      @AuthenticationPrincipal Long userId, @Valid @RequestBody JoinRoomRequest request) {
    return ResponseEntity.ok(roomService.join(userId, request));
  }

  // GET /api/v1/rooms/{roomId} - 방 상세
  @GetMapping("/{roomId}")
  public ResponseEntity<RoomDetailResponse> getDetail(
      @AuthenticationPrincipal Long userId, @PathVariable Long roomId) {
    return ResponseEntity.ok(roomService.getDetail(userId, roomId));
  }

  // PATCH /api/v1/rooms/{roomId} - 방 이름 변경
  @PatchMapping("/{roomId}")
  public ResponseEntity<RoomDetailResponse> rename(
      @AuthenticationPrincipal Long userId,
      @PathVariable Long roomId,
      @Valid @RequestBody RenameRoomRequest request) {
    return ResponseEntity.ok(roomService.rename(userId, roomId, request.getName()));
  }

  // DELETE /api/v1/rooms/{roomId}/members/me - 방 나가기
  @DeleteMapping("/{roomId}/members/me")
  public ResponseEntity<Void> leave(
      @AuthenticationPrincipal Long userId, @PathVariable Long roomId) {
    roomService.leave(userId, roomId);
    return ResponseEntity.noContent().build();
  }

  // DELETE /api/v1/rooms/{roomId}/members/{memberId} - 멤버 내보내기(방장)
  @DeleteMapping("/{roomId}/members/{memberId}")
  public ResponseEntity<Void> kickMember(
      @AuthenticationPrincipal Long userId,
      @PathVariable Long roomId,
      @PathVariable Long memberId) {
    roomService.kickMember(userId, roomId, memberId);
    return ResponseEntity.noContent().build();
  }

  // POST /api/v1/rooms/{roomId}/members/{memberId}/nudge - 콕 찌르기(재촉)
  @PostMapping("/{roomId}/members/{memberId}/nudge")
  public ResponseEntity<NudgeResponse> nudge(
      @AuthenticationPrincipal Long userId,
      @PathVariable Long roomId,
      @PathVariable Long memberId) {
    return ResponseEntity.ok(roomService.nudge(userId, roomId, memberId));
  }

  // ===== 미션 =====

  // GET /api/v1/rooms/{roomId}/mission/candidates - 미션 후보 목록
  @GetMapping("/{roomId}/mission/candidates")
  public ResponseEntity<List<MissionCandidateResponse>> getMissionCandidates(
      @AuthenticationPrincipal Long userId, @PathVariable Long roomId) {
    return ResponseEntity.ok(roomMissionService.getCandidates(userId, roomId));
  }

  // POST /api/v1/rooms/{roomId}/mission - 오늘 미션 정하기
  @PostMapping("/{roomId}/mission")
  public ResponseEntity<RoomMissionResponse> setTodayMission(
      @AuthenticationPrincipal Long userId,
      @PathVariable Long roomId,
      @Valid @RequestBody SetRoomMissionRequest request) {
    return ResponseEntity.ok(roomMissionService.setTodayMission(userId, roomId, request));
  }

  // PATCH /api/v1/rooms/{roomId}/mission - 오늘 미션 제목 수정
  @PatchMapping("/{roomId}/mission")
  public ResponseEntity<RoomMissionResponse> updateTodayMissionTitle(
      @AuthenticationPrincipal Long userId,
      @PathVariable Long roomId,
      @Valid @RequestBody UpdateRoomMissionTitleRequest request) {
    return ResponseEntity.ok(
        roomMissionService.updateTodayMissionTitle(userId, roomId, request.getTitle()));
  }

  // ===== 인증/리액션 =====

  // POST /api/v1/rooms/{roomId}/proofs - 사진 인증 (multipart/form-data)
  @PostMapping("/{roomId}/proofs")
  public ResponseEntity<RoomProofResponse> createProof(
      @AuthenticationPrincipal Long userId,
      @PathVariable Long roomId,
      @RequestParam(required = false) MultipartFile photo,
      @RequestParam(required = false) String caption) {
    return ResponseEntity.ok(roomProofService.createProof(userId, roomId, photo, caption));
  }

  // GET /api/v1/rooms/{roomId}/proofs/{proofId} - 인증 상세
  @GetMapping("/{roomId}/proofs/{proofId}")
  public ResponseEntity<RoomProofResponse> getProof(
      @AuthenticationPrincipal Long userId, @PathVariable Long roomId, @PathVariable Long proofId) {
    return ResponseEntity.ok(roomProofService.getProof(userId, roomId, proofId));
  }

  // POST /api/v1/rooms/{roomId}/proofs/{proofId}/reactions - 리액션 토글
  @PostMapping("/{roomId}/proofs/{proofId}/reactions")
  public ResponseEntity<List<RoomReactionSummaryResponse>> toggleReaction(
      @AuthenticationPrincipal Long userId,
      @PathVariable Long roomId,
      @PathVariable Long proofId,
      @Valid @RequestBody RoomReactRequest request) {
    return ResponseEntity.ok(
        roomProofService.toggleReaction(userId, roomId, proofId, request.getEmoji()));
  }

  // POST /api/v1/rooms/{roomId}/proofs/{proofId}/confirm - 피어 인증해주기
  @PostMapping("/{roomId}/proofs/{proofId}/confirm")
  public ResponseEntity<ConfirmResponse> confirm(
      @AuthenticationPrincipal Long userId, @PathVariable Long roomId, @PathVariable Long proofId) {
    return ResponseEntity.ok(roomProofService.confirm(userId, roomId, proofId));
  }

  // POST /api/v1/rooms/{roomId}/proofs/{proofId}/report - 콘텐츠 신고
  @PostMapping("/{roomId}/proofs/{proofId}/report")
  public ResponseEntity<ProofReportResponse> report(
      @AuthenticationPrincipal Long userId,
      @PathVariable Long roomId,
      @PathVariable Long proofId,
      @Valid @RequestBody ReportRequest request) {
    return ResponseEntity.ok(
        roomProofService.report(userId, roomId, proofId, request.reason(), request.detail()));
  }

  // ===== 기록 =====

  // GET /api/v1/rooms/me/history?month=YYYY-MM - 내 기록 모아보기 (모든 방)
  @GetMapping("/me/history")
  public ResponseEntity<List<MyHistoryResponse>> getMyHistory(
      @AuthenticationPrincipal Long userId, @RequestParam(required = false) String month) {
    return ResponseEntity.ok(roomProofService.getMyHistory(userId, month));
  }

  // GET /api/v1/rooms/{roomId}/history?month=YYYY-MM - 지난 기록
  @GetMapping("/{roomId}/history")
  public ResponseEntity<List<RoomHistoryResponse>> getHistory(
      @AuthenticationPrincipal Long userId,
      @PathVariable Long roomId,
      @RequestParam(required = false) String month) {
    return ResponseEntity.ok(roomProofService.getHistory(userId, roomId, month));
  }
}
