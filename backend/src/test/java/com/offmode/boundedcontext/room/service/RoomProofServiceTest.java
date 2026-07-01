package com.offmode.boundedcontext.room.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.offmode.boundedcontext.badge.service.BadgeService;
import com.offmode.boundedcontext.room.dto.response.ConfirmResponse;
import com.offmode.boundedcontext.room.dto.response.ProofReportResponse;
import com.offmode.boundedcontext.room.entity.Room;
import com.offmode.boundedcontext.room.entity.RoomMember;
import com.offmode.boundedcontext.room.entity.RoomMission;
import com.offmode.boundedcontext.room.entity.RoomProof;
import com.offmode.boundedcontext.room.entity.RoomProofReport;
import com.offmode.boundedcontext.room.repository.RoomMissionRepository;
import com.offmode.boundedcontext.room.repository.RoomProofConfirmRepository;
import com.offmode.boundedcontext.room.repository.RoomProofReportRepository;
import com.offmode.boundedcontext.room.repository.RoomProofRepository;
import com.offmode.boundedcontext.room.repository.RoomReactionRepository;
import com.offmode.boundedcontext.room.types.ProofReportReason;
import com.offmode.boundedcontext.room.types.ProofStatus;
import com.offmode.boundedcontext.room.types.RoomType;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.service.UserService;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.file.ImageUploadService;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
class RoomProofServiceTest {

  @Mock private RoomProofRepository proofRepository;
  @Mock private RoomProofConfirmRepository confirmRepository;
  @Mock private RoomProofReportRepository reportRepository;
  @Mock private RoomReactionRepository reactionRepository;
  @Mock private RoomMissionRepository missionRepository;
  @Mock private RoomService roomService;
  @Mock private RoomProofAssembler proofAssembler;
  @Mock private UserService userService;
  @Mock private BadgeService badgeService;
  @Mock private ImageUploadService imageUploadService;

  private RoomProofService service() {
    return new RoomProofService(
        proofRepository,
        confirmRepository,
        reportRepository,
        reactionRepository,
        missionRepository,
        roomService,
        proofAssembler,
        userService,
        badgeService,
        imageUploadService);
  }

  private RoomProof proofOf(Long proofId, Long roomId, Long authorId, ProofStatus status) {
    Room room = Room.builder().id(roomId).type(RoomType.GROUP).build();
    RoomMission mission = RoomMission.builder().id(10L).room(room).build();
    User author = User.builder().id(authorId).provider("kakao").providerId("a").build();
    return RoomProof.builder().id(proofId).roomMission(mission).user(author).status(status).build();
  }

  @Test
  void confirmRejectsSelfConfirm() {
    Room room = Room.builder().id(2L).type(RoomType.GROUP).build();
    RoomProof proof = proofOf(100L, 2L, 1L, ProofStatus.PENDING);
    when(roomService.getRoomOrThrow(2L)).thenReturn(room);
    when(roomService.getMembershipOrThrow(2L, 1L)).thenReturn(new RoomMember());
    when(proofRepository.findById(100L)).thenReturn(Optional.of(proof));

    assertThatThrownBy(() -> service().confirm(1L, 2L, 100L))
        .isInstanceOf(BusinessException.class)
        .hasMessage("본인 인증은 확인할 수 없습니다.");
  }

  @Test
  void confirmMarksProofVerifiedWhenRequiredConfirmReached() {
    Room room = Room.builder().id(2L).type(RoomType.GROUP).build();
    RoomProof proof = proofOf(100L, 2L, 9L, ProofStatus.PENDING);
    User confirmer = User.builder().id(1L).provider("kakao").providerId("c").build();
    when(roomService.getRoomOrThrow(2L)).thenReturn(room);
    when(roomService.getMembershipOrThrow(2L, 1L)).thenReturn(new RoomMember());
    when(proofRepository.findById(100L)).thenReturn(Optional.of(proof));
    when(roomService.getMemberCount(2L)).thenReturn(4L);
    when(roomService.requiredConfirm(RoomType.GROUP, 4)).thenReturn(3);
    when(confirmRepository.existsByRoomProofIdAndUserId(100L, 1L)).thenReturn(false);
    when(userService.getById(1L)).thenReturn(confirmer);
    when(confirmRepository.countByRoomProofId(100L)).thenReturn(3L);

    ConfirmResponse response = service().confirm(1L, 2L, 100L);

    assertThat(response.status()).isEqualTo(ProofStatus.VERIFIED);
    assertThat(response.confirmCount()).isEqualTo(3);
    assertThat(response.requiredConfirm()).isEqualTo(3);
    assertThat(proof.getStatus()).isEqualTo(ProofStatus.VERIFIED);
    verify(proofRepository).save(proof);
    // VERIFIED 전환 시 인증 주인(9L)에게 진급 처리
    verify(userService).applyVerifiedProgress(9L);
    verify(badgeService).checkAndAward(9L);
  }

  @Test
  void confirmIsIdempotentWhenAlreadyConfirmed() {
    Room room = Room.builder().id(2L).type(RoomType.GROUP).build();
    RoomProof proof = proofOf(100L, 2L, 9L, ProofStatus.PENDING);
    when(roomService.getRoomOrThrow(2L)).thenReturn(room);
    when(roomService.getMembershipOrThrow(2L, 1L)).thenReturn(new RoomMember());
    when(proofRepository.findById(100L)).thenReturn(Optional.of(proof));
    when(roomService.getMemberCount(2L)).thenReturn(4L);
    when(roomService.requiredConfirm(RoomType.GROUP, 4)).thenReturn(3);
    when(confirmRepository.existsByRoomProofIdAndUserId(100L, 1L)).thenReturn(true);
    when(confirmRepository.countByRoomProofId(100L)).thenReturn(1L);

    ConfirmResponse response = service().confirm(1L, 2L, 100L);

    assertThat(response.status()).isEqualTo(ProofStatus.PENDING);
    verify(confirmRepository, never()).save(any());
    verify(userService, never()).applyVerifiedProgress(anyLong());
    verify(badgeService, never()).checkAndAward(anyLong());
  }

  @Test
  void createProofImmediatelyVerifiedTriggersProgressForUploader() {
    Room room = Room.builder().id(2L).type(RoomType.SOLO).build();
    RoomMission mission = RoomMission.builder().id(10L).room(room).build();
    User uploader = User.builder().id(1L).provider("kakao").providerId("u").build();
    when(roomService.getRoomOrThrow(2L)).thenReturn(room);
    when(roomService.getMembershipOrThrow(2L, 1L)).thenReturn(new RoomMember());
    when(missionRepository.findByRoomIdAndDate(eq(2L), any())).thenReturn(Optional.of(mission));
    when(proofRepository.existsByRoomMissionIdAndUserId(10L, 1L)).thenReturn(false);
    when(imageUploadService.uploadVerificationImage(any())).thenReturn("/uploads/a.jpg");
    when(roomService.getMemberCount(2L)).thenReturn(1L);
    when(roomService.requiredConfirm(RoomType.SOLO, 1)).thenReturn(0);
    when(userService.getById(1L)).thenReturn(uploader);
    when(proofRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    MockMultipartFile photo =
        new MockMultipartFile("photo", "a.jpg", "image/jpeg", new byte[] {1, 2, 3});
    service().createProof(1L, 2L, photo, "caption");

    // 업로드 즉시 VERIFIED → 업로더 본인(1L)에게 진급 처리
    verify(userService).applyVerifiedProgress(1L);
    verify(badgeService).checkAndAward(1L);
  }

  @Test
  void createProofRejectsWhenTodayMissionNotSet() {
    Room room = Room.builder().id(2L).type(RoomType.GROUP).build();
    when(roomService.getRoomOrThrow(2L)).thenReturn(room);
    when(roomService.getMembershipOrThrow(2L, 1L)).thenReturn(new RoomMember());
    when(missionRepository.findByRoomIdAndDate(eq(2L), any())).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service().createProof(1L, 2L, null, null))
        .isInstanceOf(BusinessException.class)
        .hasMessage("오늘 정해진 미션이 없습니다.");
  }

  @Test
  void createProofRejectsDuplicateProof() {
    Room room = Room.builder().id(2L).type(RoomType.GROUP).build();
    RoomMission mission = RoomMission.builder().id(10L).room(room).build();
    when(roomService.getRoomOrThrow(2L)).thenReturn(room);
    when(roomService.getMembershipOrThrow(2L, 1L)).thenReturn(new RoomMember());
    when(missionRepository.findByRoomIdAndDate(eq(2L), any())).thenReturn(Optional.of(mission));
    when(proofRepository.existsByRoomMissionIdAndUserId(10L, 1L)).thenReturn(true);

    assertThatThrownBy(() -> service().createProof(1L, 2L, null, null))
        .isInstanceOf(BusinessException.class)
        .hasMessage("오늘 이미 인증했습니다.");
  }

  @Test
  void reportRejectsSelfReport() {
    Room room = Room.builder().id(2L).type(RoomType.GROUP).build();
    RoomProof proof = proofOf(100L, 2L, 1L, ProofStatus.PENDING);
    when(roomService.getRoomOrThrow(2L)).thenReturn(room);
    when(roomService.getMembershipOrThrow(2L, 1L)).thenReturn(new RoomMember());
    when(proofRepository.findById(100L)).thenReturn(Optional.of(proof));

    assertThatThrownBy(() -> service().report(1L, 2L, 100L, ProofReportReason.SPAM, null))
        .isInstanceOf(BusinessException.class)
        .hasMessage("본인 인증은 신고할 수 없습니다.");
    verify(reportRepository, never()).save(any());
  }

  @Test
  void reportRejectsDuplicateReport() {
    Room room = Room.builder().id(2L).type(RoomType.GROUP).build();
    RoomProof proof = proofOf(100L, 2L, 9L, ProofStatus.PENDING);
    when(roomService.getRoomOrThrow(2L)).thenReturn(room);
    when(roomService.getMembershipOrThrow(2L, 1L)).thenReturn(new RoomMember());
    when(proofRepository.findById(100L)).thenReturn(Optional.of(proof));
    when(reportRepository.existsByRoomProofIdAndReporterId(100L, 1L)).thenReturn(true);

    assertThatThrownBy(() -> service().report(1L, 2L, 100L, ProofReportReason.OFFENSIVE, "욕설"))
        .isInstanceOf(BusinessException.class)
        .hasMessage("이미 신고한 콘텐츠입니다.");
    verify(reportRepository, never()).save(any());
  }

  @Test
  void reportSavesAndReturnsReportId() {
    Room room = Room.builder().id(2L).type(RoomType.GROUP).build();
    RoomProof proof = proofOf(100L, 2L, 9L, ProofStatus.PENDING);
    User reporter = User.builder().id(1L).provider("kakao").providerId("r").build();
    when(roomService.getRoomOrThrow(2L)).thenReturn(room);
    when(roomService.getMembershipOrThrow(2L, 1L)).thenReturn(new RoomMember());
    when(proofRepository.findById(100L)).thenReturn(Optional.of(proof));
    when(reportRepository.existsByRoomProofIdAndReporterId(100L, 1L)).thenReturn(false);
    when(userService.getById(1L)).thenReturn(reporter);
    when(reportRepository.save(any())).thenReturn(RoomProofReport.builder().id(555L).build());

    ProofReportResponse response = service().report(1L, 2L, 100L, ProofReportReason.OTHER, "기타 사유");

    assertThat(response.reportId()).isEqualTo(555L);
    verify(reportRepository).save(any(RoomProofReport.class));
  }
}
