package com.offmode.boundedcontext.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.offmode.boundedcontext.mission.repository.UserMissionRepository;
import com.offmode.boundedcontext.mission.types.MissionStatus;
import com.offmode.boundedcontext.room.repository.RoomProofRepository;
import com.offmode.boundedcontext.room.types.ProofStatus;
import com.offmode.boundedcontext.user.dto.response.UserStatsResponse;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

  @Mock private UserMissionRepository userMissionRepository;
  @Mock private RoomProofRepository roomProofRepository;

  // getStats는 개인 미션·방 인증 레포만 사용하므로 나머지 의존성은 null 로 주입한다.
  private UserService service() {
    return new UserService(
        null, userMissionRepository, null, null, null, null, null, roomProofRepository);
  }

  private void stubCategoryCounts() {
    when(userMissionRepository.countByUserIdAndStatusAndMissionCategory(
            eq(1L), eq(MissionStatus.VERIFIED), any()))
        .thenReturn(0L);
  }

  @Test
  void getStats_방인증을_누적_통계에_합산한다() {
    when(userMissionRepository.findByUserIdOrderByAssignedAtDesc(1L))
        .thenReturn(List.of()); // 레거시 0
    when(userMissionRepository.countByUserIdAndStatus(1L, MissionStatus.VERIFIED)).thenReturn(2L);
    stubCategoryCounts();
    when(userMissionRepository.findVerifiedDateTimes(1L, MissionStatus.VERIFIED))
        .thenReturn(List.of());
    when(roomProofRepository.countByUserId(1L)).thenReturn(5L);
    when(roomProofRepository.countByUserIdAndStatus(1L, ProofStatus.VERIFIED)).thenReturn(3L);
    when(roomProofRepository.findVerifiedDatesByUser(1L, ProofStatus.VERIFIED))
        .thenReturn(List.of());

    UserStatsResponse res = service().getStats(1L);

    assertThat(res.getTotalVerified()).isEqualTo(5L); // 레거시 2 + 방 3
    assertThat(res.getTotalMissions()).isEqualTo(5L); // 레거시 0 + 방 5
  }

  @Test
  void getStats_연속달성은_방인증_날짜도_포함한다() {
    when(userMissionRepository.findByUserIdOrderByAssignedAtDesc(1L)).thenReturn(List.of());
    when(userMissionRepository.countByUserIdAndStatus(1L, MissionStatus.VERIFIED)).thenReturn(0L);
    stubCategoryCounts();
    when(userMissionRepository.findVerifiedDateTimes(1L, MissionStatus.VERIFIED))
        .thenReturn(List.of()); // 개인 미션 인증 없음
    when(roomProofRepository.countByUserId(1L)).thenReturn(2L);
    when(roomProofRepository.countByUserIdAndStatus(1L, ProofStatus.VERIFIED)).thenReturn(2L);
    // 오늘 + 어제 방 인증 → 연속 2일
    when(roomProofRepository.findVerifiedDatesByUser(1L, ProofStatus.VERIFIED))
        .thenReturn(List.of(LocalDate.now(), LocalDate.now().minusDays(1)));

    UserStatsResponse res = service().getStats(1L);

    assertThat(res.getStreak()).isEqualTo(2);
  }
}
