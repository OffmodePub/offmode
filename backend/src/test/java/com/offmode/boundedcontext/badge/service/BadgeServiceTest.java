package com.offmode.boundedcontext.badge.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.offmode.boundedcontext.badge.entity.UserBadge;
import com.offmode.boundedcontext.badge.repository.UserBadgeRepository;
import com.offmode.boundedcontext.badge.types.BadgeDefinition;
import com.offmode.boundedcontext.mission.repository.UserMissionRepository;
import com.offmode.boundedcontext.mission.types.MissionCategory;
import com.offmode.boundedcontext.mission.types.MissionStatus;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BadgeServiceTest {

  @Mock private UserBadgeRepository userBadgeRepository;
  @Mock private UserMissionRepository userMissionRepository;
  @Mock private UserRepository userRepository;

  @Test
  void checkAndAwardAwardsFirstMissionAcceptedBadge() {
    BadgeService service =
        new BadgeService(userBadgeRepository, userMissionRepository, userRepository);
    User user = User.builder().id(1L).provider("kakao").providerId("p1").build();
    when(userBadgeRepository.findEarnedKeys(1L)).thenReturn(Set.of());
    when(userMissionRepository.existsByUserId(1L)).thenReturn(true);
    when(userMissionRepository.findVerifiedDateTimes(1L, MissionStatus.VERIFIED))
        .thenReturn(Collections.emptyList());
    when(userRepository.getReferenceById(1L)).thenReturn(user);
    when(userBadgeRepository.save(any(UserBadge.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    List<BadgeDefinition> awarded = service.checkAndAward(1L);

    assertThat(awarded).contains(BadgeDefinition.OFFMODE_ENTRY);
  }

  @Test
  void checkAndAwardAwardsVerifiedCountAndCategoryBadges() {
    BadgeService service =
        new BadgeService(userBadgeRepository, userMissionRepository, userRepository);
    User user = User.builder().id(1L).provider("kakao").providerId("p1").build();
    when(userBadgeRepository.findEarnedKeys(1L)).thenReturn(Set.of());
    when(userMissionRepository.countByUserIdAndStatus(1L, MissionStatus.VERIFIED)).thenReturn(10L);
    when(userMissionRepository.countByUserIdAndStatusAndMissionCategory(
            1L, MissionStatus.VERIFIED, MissionCategory.ENERGY))
        .thenReturn(10L);
    when(userMissionRepository.findVerifiedDateTimes(1L, MissionStatus.VERIFIED))
        .thenReturn(Collections.emptyList());
    when(userRepository.getReferenceById(1L)).thenReturn(user);
    when(userBadgeRepository.save(any(UserBadge.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    List<BadgeDefinition> awarded = service.checkAndAward(1L);

    assertThat(awarded)
        .contains(
            BadgeDefinition.EXPLORER_LV01, BadgeDefinition.COLLECTOR_LV02, BadgeDefinition.WALKER);
  }

  @Test
  void checkAndAwardAwardsSevenDayStreakBadge() {
    BadgeService service =
        new BadgeService(userBadgeRepository, userMissionRepository, userRepository);
    User user = User.builder().id(1L).provider("kakao").providerId("p1").build();
    LocalDateTime start = LocalDateTime.now().minusDays(6);
    when(userBadgeRepository.findEarnedKeys(1L)).thenReturn(Set.of());
    when(userMissionRepository.findVerifiedDateTimes(1L, MissionStatus.VERIFIED))
        .thenReturn(java.util.stream.IntStream.range(0, 7).mapToObj(start::plusDays).toList());
    when(userRepository.getReferenceById(1L)).thenReturn(user);
    when(userBadgeRepository.save(any(UserBadge.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    List<BadgeDefinition> awarded = service.checkAndAward(1L);

    assertThat(awarded).contains(BadgeDefinition.SPEEDRUNNER);
  }
}
