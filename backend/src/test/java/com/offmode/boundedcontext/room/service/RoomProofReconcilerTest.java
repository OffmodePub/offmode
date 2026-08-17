package com.offmode.boundedcontext.room.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.offmode.boundedcontext.badge.service.BadgeService;
import com.offmode.boundedcontext.room.entity.Room;
import com.offmode.boundedcontext.room.entity.RoomMission;
import com.offmode.boundedcontext.room.entity.RoomProof;
import com.offmode.boundedcontext.room.repository.RoomMissionRepository;
import com.offmode.boundedcontext.room.repository.RoomProofConfirmRepository;
import com.offmode.boundedcontext.room.repository.RoomProofRepository;
import com.offmode.boundedcontext.room.types.ProofStatus;
import com.offmode.boundedcontext.room.types.RoomType;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.service.UserService;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RoomProofReconcilerTest {

  private static final Long ROOM_ID = 2L;
  private static final Long MISSION_ID = 30L;

  @Mock private RoomMissionRepository missionRepository;
  @Mock private RoomProofRepository proofRepository;
  @Mock private RoomProofConfirmRepository confirmRepository;
  @Mock private UserService userService;
  @Mock private BadgeService badgeService;

  private RoomProofReconciler reconciler() {
    return new RoomProofReconciler(
        missionRepository, proofRepository, confirmRepository, userService, badgeService);
  }

  @Test
  void verifiesProofThatNowMeetsTheLoweredRequirement() {
    RoomProof proof = pendingProof(100L, 7L);
    stubTodayMission();
    when(proofRepository.findByRoomMissionIdAndStatusOrderByIdAsc(MISSION_ID, ProofStatus.PENDING))
        .thenReturn(List.of(proof));
    when(proofRepository.findWithLockById(100L)).thenReturn(Optional.of(proof));
    when(confirmRepository.countByRoomProofId(100L)).thenReturn(1L);

    reconciler().reconcileTodayProofs(ROOM_ID, 1);

    assertThat(proof.getStatus()).isEqualTo(ProofStatus.VERIFIED);
    verify(proofRepository).save(proof);
    verify(userService).applyVerifiedProgress(7L);
    verify(badgeService).checkAndAward(7L);
  }

  @Test
  void leavesProofPendingWhenConfirmsAreStillShort() {
    RoomProof proof = pendingProof(100L, 7L);
    stubTodayMission();
    when(proofRepository.findByRoomMissionIdAndStatusOrderByIdAsc(MISSION_ID, ProofStatus.PENDING))
        .thenReturn(List.of(proof));
    when(proofRepository.findWithLockById(100L)).thenReturn(Optional.of(proof));
    when(confirmRepository.countByRoomProofId(100L)).thenReturn(1L);

    // 4명이던 방에서 한 명만 빠져 요구치는 아직 2
    reconciler().reconcileTodayProofs(ROOM_ID, 2);

    assertThat(proof.getStatus()).isEqualTo(ProofStatus.PENDING);
    verify(proofRepository, never()).save(any(RoomProof.class));
    verify(userService, never()).applyVerifiedProgress(anyLong());
    verify(badgeService, never()).checkAndAward(anyLong());
  }

  @Test
  void verifiesEveryPendingProofWhenNoConfirmIsRequiredAnymore() {
    RoomProof mine = pendingProof(100L, 7L);
    RoomProof theirs = pendingProof(101L, 8L);
    stubTodayMission();
    when(proofRepository.findByRoomMissionIdAndStatusOrderByIdAsc(MISSION_ID, ProofStatus.PENDING))
        .thenReturn(List.of(mine, theirs));
    when(proofRepository.findWithLockById(100L)).thenReturn(Optional.of(mine));
    when(proofRepository.findWithLockById(101L)).thenReturn(Optional.of(theirs));
    when(confirmRepository.countByRoomProofId(anyLong())).thenReturn(0L);

    // 혼자만 남아 확인해 줄 사람이 없다 — 요구치 0
    reconciler().reconcileTodayProofs(ROOM_ID, 0);

    assertThat(mine.getStatus()).isEqualTo(ProofStatus.VERIFIED);
    assertThat(theirs.getStatus()).isEqualTo(ProofStatus.VERIFIED);
    verify(userService).applyVerifiedProgress(7L);
    verify(userService).applyVerifiedProgress(8L);
  }

  @Test
  void skipsProofAlreadyVerifiedByAConcurrentConfirm() {
    RoomProof stale = pendingProof(100L, 7L);
    // 목록을 읽은 뒤 confirm 이 먼저 끝나 락 조회 시점엔 이미 완료된 상태
    RoomProof locked = pendingProof(100L, 7L);
    locked.setStatus(ProofStatus.VERIFIED);

    stubTodayMission();
    when(proofRepository.findByRoomMissionIdAndStatusOrderByIdAsc(MISSION_ID, ProofStatus.PENDING))
        .thenReturn(List.of(stale));
    when(proofRepository.findWithLockById(100L)).thenReturn(Optional.of(locked));

    reconciler().reconcileTodayProofs(ROOM_ID, 0);

    // 레벨업·배지가 두 번 실행되지 않아야 한다
    verify(proofRepository, never()).save(any(RoomProof.class));
    verify(userService, never()).applyVerifiedProgress(anyLong());
    verify(badgeService, never()).checkAndAward(anyLong());
  }

  @Test
  void doesNothingWhenTodayHasNoMission() {
    when(missionRepository.findByRoomIdAndDate(eq(ROOM_ID), any(LocalDate.class)))
        .thenReturn(Optional.empty());

    reconciler().reconcileTodayProofs(ROOM_ID, 0);

    verify(proofRepository, never())
        .findByRoomMissionIdAndStatusOrderByIdAsc(anyLong(), any(ProofStatus.class));
    verify(userService, never()).applyVerifiedProgress(anyLong());
  }

  private void stubTodayMission() {
    Room room = Room.builder().id(ROOM_ID).type(RoomType.GROUP).build();
    RoomMission mission =
        RoomMission.builder().id(MISSION_ID).room(room).date(LocalDate.now()).build();
    when(missionRepository.findByRoomIdAndDate(eq(ROOM_ID), any(LocalDate.class)))
        .thenReturn(Optional.of(mission));
  }

  private static RoomProof pendingProof(Long proofId, Long ownerId) {
    return RoomProof.builder()
        .id(proofId)
        .user(User.builder().id(ownerId).build())
        .status(ProofStatus.PENDING)
        .build();
  }
}
