package com.offmode.boundedcontext.room.service;

import com.offmode.boundedcontext.badge.service.BadgeService;
import com.offmode.boundedcontext.room.entity.RoomMission;
import com.offmode.boundedcontext.room.entity.RoomProof;
import com.offmode.boundedcontext.room.repository.RoomMissionRepository;
import com.offmode.boundedcontext.room.repository.RoomProofConfirmRepository;
import com.offmode.boundedcontext.room.repository.RoomProofRepository;
import com.offmode.boundedcontext.room.types.ProofStatus;
import com.offmode.boundedcontext.user.service.UserService;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 방 인원이 줄어 피어 확인 요구치가 낮아졌을 때, 이미 올라온 인증을 다시 판정한다.
 *
 * <p>요구치는 {@code memberCount - 1} 로 매번 새로 계산하는데 상태 전환은 {@code confirm} 이 호출될 때만 평가한다. 그래서 멤버가 나가면
 * 이미 조건을 채운 인증이 {@code PENDING} 에 갇힌다 — 3인방에서 확인 1개를 받은 인증은 한 명이 나가는 순간 요구치가 1로 줄어 완료여야 하지만, 남은
 * 확인자는 이미 확인을 마쳐 다시 호출할 일이 없다. 화면에는 "1/1 완료"로 보이는데 레벨업·배지는 영영 실행되지 않는다.
 *
 * <p>요구치를 직접 계산하지 않고 호출부에서 받는다. 계산에 필요한 방 정보는 {@link RoomService} 가 이미 들고 있고, 여기서 다시 가져오면 순환 의존이
 * 생긴다.
 *
 * <p>과거 미션은 건드리지 않는다. 지난 날짜가 완료로 바뀌면 연속 달성일과 누적 통계가 소급 변동해 사용자가 혼란스럽다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RoomProofReconciler {

  private final RoomMissionRepository missionRepository;
  private final RoomProofRepository proofRepository;
  private final RoomProofConfirmRepository confirmRepository;
  private final UserService userService;
  private final BadgeService badgeService;

  /**
   * 오늘 미션의 미완료 인증 중 새 요구치를 채운 것을 완료 처리한다.
   *
   * @param requiredConfirm 멤버가 빠진 뒤의 요구 확인 수 (호출부가 계산해 넘긴다)
   */
  @Transactional
  public void reconcileTodayProofs(Long roomId, int requiredConfirm) {
    RoomMission todayMission =
        missionRepository.findByRoomIdAndDate(roomId, LocalDate.now()).orElse(null);
    if (todayMission == null) return;

    List<RoomProof> pending =
        proofRepository.findByRoomMissionIdAndStatusOrderByIdAsc(
            todayMission.getId(), ProofStatus.PENDING);

    for (RoomProof stale : pending) {
      // 목록을 읽은 뒤 confirm 이 끼어들 수 있으므로 행 락으로 다시 읽어 직렬화한다.
      // 락 없이 전환하면 같은 인증에 레벨업·배지가 두 번 실행될 수 있다.
      RoomProof proof = proofRepository.findWithLockById(stale.getId()).orElse(null);
      if (proof == null || proof.getStatus() == ProofStatus.VERIFIED) continue;

      long confirmCount = confirmRepository.countByRoomProofId(proof.getId());
      if (confirmCount < requiredConfirm) continue;

      proof.setStatus(ProofStatus.VERIFIED);
      proofRepository.save(proof);

      // RoomProofService.applyVerifiedProgress 와 같은 처리. 그쪽을 부르면
      // RoomProofService → RoomService → 여기로 도는 순환이 생겨 두 줄을 그대로 둔다.
      Long ownerId = proof.getUser().getId();
      userService.applyVerifiedProgress(ownerId);
      badgeService.checkAndAward(ownerId);

      log.info(
          "인원 감소로 인증 완료 처리: proofId={}, roomId={}, 확인 {}/{}",
          proof.getId(),
          roomId,
          confirmCount,
          requiredConfirm);
    }
  }
}
