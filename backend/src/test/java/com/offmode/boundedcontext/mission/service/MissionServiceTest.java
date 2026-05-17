package com.offmode.boundedcontext.mission.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.offmode.boundedcontext.badge.service.BadgeService;
import com.offmode.boundedcontext.mission.dto.response.MissionWeightResponse;
import com.offmode.boundedcontext.mission.entity.Mission;
import com.offmode.boundedcontext.mission.entity.UserMission;
import com.offmode.boundedcontext.mission.repository.MissionRepository;
import com.offmode.boundedcontext.mission.repository.UserMissionRepository;
import com.offmode.boundedcontext.mission.types.MissionCategory;
import com.offmode.boundedcontext.mission.types.MissionStatus;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MissionServiceTest {

  @Mock private MissionRepository missionRepository;
  @Mock private UserMissionRepository userMissionRepository;
  @Mock private UserRepository userRepository;
  @Mock private BadgeService badgeService;

  @Test
  void setTodayMissionCreatesMissionWhenTodayMissionDoesNotExist() {
    MissionService service =
        new MissionService(missionRepository, userMissionRepository, userRepository, badgeService);
    User user = User.builder().id(1L).provider("kakao").providerId("p1").build();
    when(userMissionRepository.findFirstByUserIdAndAssignedAtBetweenOrderByAssignedAtDesc(
            eq(1L), any(), any()))
        .thenReturn(Optional.empty());
    when(userRepository.getReferenceById(1L)).thenReturn(user);
    when(userMissionRepository.save(any(UserMission.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    UserMission result = service.setTodayMission(1L, "🚶", "산책하기", MissionCategory.VITALITY);

    assertThat(result.getUser()).isSameAs(user);
    assertThat(result.getMissionText()).isEqualTo("산책하기");
    assertThat(result.getStatus()).isEqualTo(MissionStatus.PENDING);
    verify(badgeService).checkAndAward(1L);
  }

  @Test
  void setTodayMissionOverwritesPendingMission() {
    MissionService service =
        new MissionService(missionRepository, userMissionRepository, userRepository, badgeService);
    UserMission existing =
        UserMission.builder()
            .id(10L)
            .missionIcon("old")
            .missionText("기존")
            .missionCategory(MissionCategory.ENERGY)
            .status(MissionStatus.PENDING)
            .verifiedAt(LocalDateTime.now())
            .build();
    when(userMissionRepository.findFirstByUserIdAndAssignedAtBetweenOrderByAssignedAtDesc(
            eq(1L), any(), any()))
        .thenReturn(Optional.of(existing));
    when(userMissionRepository.save(existing)).thenReturn(existing);

    UserMission result = service.setTodayMission(1L, "new", "새 미션", MissionCategory.INTELLECT);

    assertThat(result.getId()).isEqualTo(10L);
    assertThat(result.getMissionIcon()).isEqualTo("new");
    assertThat(result.getMissionText()).isEqualTo("새 미션");
    assertThat(result.getMissionCategory()).isEqualTo(MissionCategory.INTELLECT);
    assertThat(result.getStatus()).isEqualTo(MissionStatus.PENDING);
    assertThat(result.getVerifiedAt()).isNull();
  }

  @Test
  void setTodayMissionCreatesNewMissionWhenExistingMissionIsVerified() {
    MissionService service =
        new MissionService(missionRepository, userMissionRepository, userRepository, badgeService);
    User user = User.builder().id(1L).provider("kakao").providerId("p1").build();
    UserMission existing =
        UserMission.builder()
            .id(10L)
            .user(user)
            .missionText("완료")
            .missionCategory(MissionCategory.ENERGY)
            .status(MissionStatus.VERIFIED)
            .build();
    when(userMissionRepository.findFirstByUserIdAndAssignedAtBetweenOrderByAssignedAtDesc(
            eq(1L), any(), any()))
        .thenReturn(Optional.of(existing));
    when(userRepository.getReferenceById(1L)).thenReturn(user);
    when(userMissionRepository.save(any(UserMission.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    UserMission result = service.setTodayMission(1L, "new", "새 미션", MissionCategory.INTELLECT);

    assertThat(result).isNotSameAs(existing);
    assertThat(result.getUser()).isSameAs(user);
    assertThat(result.getMissionText()).isEqualTo("새 미션");
  }

  @Test
  void weightedPoolReducesWeightForRecentlyAssignedMission() {
    MissionService service =
        new MissionService(missionRepository, userMissionRepository, userRepository, badgeService);
    when(missionRepository.findAll())
        .thenReturn(
            List.of(
                Mission.builder()
                    .id(1L)
                    .icon("a")
                    .text("최근")
                    .category(MissionCategory.ENERGY)
                    .build(),
                Mission.builder()
                    .id(2L)
                    .icon("b")
                    .text("처음")
                    .category(MissionCategory.VITALITY)
                    .build()));
    List<Object[]> latestAssigned = new ArrayList<>();
    latestAssigned.add(new Object[] {"최근", LocalDateTime.now().minusDays(3)});
    when(userMissionRepository.findLatestAssignedAtPerMissionText(1L)).thenReturn(latestAssigned);

    List<MissionWeightResponse> result = service.getWeightedPool(1L);

    assertThat(result)
        .extracting(MissionWeightResponse::getText, MissionWeightResponse::getWeight)
        .containsExactlyInAnyOrder(
            org.assertj.core.groups.Tuple.tuple("최근", 0.1),
            org.assertj.core.groups.Tuple.tuple("처음", 1.0));
  }
}
