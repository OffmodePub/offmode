package com.offmode.boundedcontext.room.service;

import com.offmode.boundedcontext.room.dto.response.ConfirmResponse;
import com.offmode.boundedcontext.room.dto.response.HistoryProofResponse;
import com.offmode.boundedcontext.room.dto.response.MiniMissionResponse;
import com.offmode.boundedcontext.room.dto.response.RoomHistoryResponse;
import com.offmode.boundedcontext.room.dto.response.RoomProofResponse;
import com.offmode.boundedcontext.room.dto.response.RoomReactionSummaryResponse;
import com.offmode.boundedcontext.room.entity.Room;
import com.offmode.boundedcontext.room.entity.RoomMission;
import com.offmode.boundedcontext.room.entity.RoomProof;
import com.offmode.boundedcontext.room.entity.RoomProofConfirm;
import com.offmode.boundedcontext.room.entity.RoomReaction;
import com.offmode.boundedcontext.room.repository.RoomMissionRepository;
import com.offmode.boundedcontext.room.repository.RoomProofConfirmRepository;
import com.offmode.boundedcontext.room.repository.RoomProofRepository;
import com.offmode.boundedcontext.room.repository.RoomReactionRepository;
import com.offmode.boundedcontext.room.types.ProofStatus;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.service.UserService;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.file.ImageUploadService;
import com.offmode.global.status.ErrorStatus;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomProofService {

  private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

  private final RoomProofRepository proofRepository;
  private final RoomProofConfirmRepository confirmRepository;
  private final RoomReactionRepository reactionRepository;
  private final RoomMissionRepository missionRepository;
  private final RoomService roomService;
  private final RoomProofAssembler proofAssembler;
  private final UserService userService;
  private final ImageUploadService imageUploadService;

  // ===== 사진 인증 =====

  @Transactional
  public RoomProofResponse createProof(
      Long userId, Long roomId, MultipartFile photo, String caption) {
    Room room = roomService.getRoomOrThrow(roomId);
    roomService.getMembershipOrThrow(roomId, userId);

    RoomMission todayMission =
        missionRepository
            .findByRoomIdAndDate(roomId, LocalDate.now())
            .orElseThrow(() -> new BusinessException(ErrorStatus.ROOM_MISSION_NOT_SET));

    if (proofRepository.existsByRoomMissionIdAndUserId(todayMission.getId(), userId)) {
      throw new BusinessException(ErrorStatus.ROOM_PROOF_ALREADY_SUBMITTED);
    }

    if (photo == null || photo.isEmpty()) {
      throw new BusinessException(ErrorStatus.FILE_EMPTY);
    }
    String photoUrl = imageUploadService.uploadVerificationImage(photo);

    int memberCount = (int) roomService.getMemberCount(roomId);
    int requiredConfirm = roomService.requiredConfirm(room.getType(), memberCount);
    // SOLO 또는 (혼자뿐인 GROUP 등) requiredConfirm 이 0이면 업로드 즉시 인증 완료
    ProofStatus status = requiredConfirm <= 0 ? ProofStatus.VERIFIED : ProofStatus.PENDING;

    User user = userService.getById(userId);
    RoomProof proof =
        proofRepository.save(
            RoomProof.builder()
                .roomMission(todayMission)
                .user(user)
                .photoUrl(photoUrl)
                .caption(caption)
                .status(status)
                .build());

    return proofAssembler.build(proof, requiredConfirm, userId);
  }

  // ===== 인증 상세 =====

  @Transactional(readOnly = true)
  public RoomProofResponse getProof(Long userId, Long roomId, Long proofId) {
    Room room = roomService.getRoomOrThrow(roomId);
    roomService.getMembershipOrThrow(roomId, userId);
    RoomProof proof = getProofInRoomOrThrow(proofId, roomId);

    int requiredConfirm =
        roomService.requiredConfirm(room.getType(), (int) roomService.getMemberCount(roomId));
    return proofAssembler.build(proof, requiredConfirm, userId);
  }

  // ===== 리액션 토글 =====

  @Transactional
  public List<RoomReactionSummaryResponse> toggleReaction(
      Long userId, Long roomId, Long proofId, String emoji) {
    roomService.getRoomOrThrow(roomId);
    roomService.getMembershipOrThrow(roomId, userId);
    RoomProof proof = getProofInRoomOrThrow(proofId, roomId);

    RoomReaction existing =
        reactionRepository.findByRoomProofIdAndUserId(proofId, userId).stream()
            .filter(reaction -> reaction.getEmoji().equals(emoji))
            .findFirst()
            .orElse(null);

    if (existing != null) {
      reactionRepository.delete(existing);
    } else {
      User user = userService.getById(userId);
      reactionRepository.save(
          RoomReaction.builder().roomProof(proof).user(user).emoji(emoji).build());
    }

    return proofAssembler.aggregateReactions(
        reactionRepository.findRowsByRoomProofId(proofId), userId);
  }

  // ===== 피어 인증해주기 =====

  @Transactional
  public ConfirmResponse confirm(Long userId, Long roomId, Long proofId) {
    Room room = roomService.getRoomOrThrow(roomId);
    roomService.getMembershipOrThrow(roomId, userId);
    RoomProof proof = getProofInRoomOrThrow(proofId, roomId);

    if (proof.getUser().getId().equals(userId)) {
      throw new BusinessException(ErrorStatus.ROOM_SELF_CONFIRM_NOT_ALLOWED);
    }

    int memberCount = (int) roomService.getMemberCount(roomId);
    int requiredConfirm = roomService.requiredConfirm(room.getType(), memberCount);

    // 멱등: 이미 인증해줬으면 현재 상태만 반환
    if (!confirmRepository.existsByRoomProofIdAndUserId(proofId, userId)) {
      User confirmer = userService.getById(userId);
      confirmRepository.save(RoomProofConfirm.builder().roomProof(proof).user(confirmer).build());
    }

    int confirmCount = (int) confirmRepository.countByRoomProofId(proofId);
    if (confirmCount >= requiredConfirm && proof.getStatus() != ProofStatus.VERIFIED) {
      proof.setStatus(ProofStatus.VERIFIED);
      proofRepository.save(proof);
    }

    return new ConfirmResponse(confirmCount, requiredConfirm, proof.getStatus());
  }

  // ===== 지난 기록 (월별) =====

  @Transactional(readOnly = true)
  public List<RoomHistoryResponse> getHistory(Long userId, Long roomId, String month) {
    roomService.getRoomOrThrow(roomId);
    roomService.getMembershipOrThrow(roomId, userId);

    YearMonth yearMonth =
        month == null || month.isBlank() ? YearMonth.now() : YearMonth.parse(month);
    LocalDate start = yearMonth.atDay(1);
    LocalDate end = yearMonth.atEndOfMonth();

    List<RoomMission> missions =
        missionRepository.findByRoomIdAndDateBetweenOrderByDateDesc(roomId, start, end);
    if (missions.isEmpty()) return List.of();

    List<Long> missionIds = missions.stream().map(RoomMission::getId).toList();
    Map<Long, List<RoomProof>> proofsByMission =
        proofRepository.findByRoomMissionIdInOrderByCreatedAtAsc(missionIds).stream()
            .collect(Collectors.groupingBy(proof -> proof.getRoomMission().getId()));

    List<RoomHistoryResponse> result = new ArrayList<>();
    for (RoomMission mission : missions) {
      List<RoomProof> proofs = proofsByMission.getOrDefault(mission.getId(), List.of());
      int confirmedCount =
          (int) proofs.stream().filter(p -> p.getStatus() == ProofStatus.VERIFIED).count();
      List<HistoryProofResponse> proofResponses =
          proofs.stream()
              .map(
                  p ->
                      new HistoryProofResponse(
                          p.getCreatedAt() == null ? null : p.getCreatedAt().format(TIME_FORMAT),
                          p.getUser().getName(),
                          p.getUser().getAvatar(),
                          p.getPhotoUrl(),
                          p.getStatus()))
              .toList();
      result.add(
          new RoomHistoryResponse(
              mission.getDate(),
              confirmedCount,
              new MiniMissionResponse(mission.getIcon(), mission.getTitle()),
              proofResponses));
    }
    return result;
  }

  private RoomProof getProofInRoomOrThrow(Long proofId, Long roomId) {
    RoomProof proof =
        proofRepository
            .findById(proofId)
            .orElseThrow(() -> new BusinessException(ErrorStatus.ROOM_PROOF_NOT_FOUND));
    if (!proof.getRoomMission().getRoom().getId().equals(roomId)) {
      throw new BusinessException(ErrorStatus.ROOM_PROOF_NOT_FOUND);
    }
    return proof;
  }
}
