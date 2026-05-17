package com.offmode.boundedcontext.feed.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.offmode.boundedcontext.badge.service.BadgeService;
import com.offmode.boundedcontext.feed.dto.response.FeedItemResponse;
import com.offmode.boundedcontext.feed.entity.Reaction;
import com.offmode.boundedcontext.feed.entity.Verification;
import com.offmode.boundedcontext.feed.repository.ReactionRepository;
import com.offmode.boundedcontext.feed.repository.VerificationConfirmRepository;
import com.offmode.boundedcontext.feed.repository.VerificationRepository;
import com.offmode.boundedcontext.mission.entity.UserMission;
import com.offmode.boundedcontext.mission.repository.UserMissionRepository;
import com.offmode.boundedcontext.mission.types.MissionCategory;
import com.offmode.boundedcontext.mission.types.MissionStatus;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.service.UserService;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.file.ImageUploadService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FeedServiceTest {

  @Mock private VerificationRepository verificationRepository;
  @Mock private VerificationConfirmRepository confirmRepository;
  @Mock private ReactionRepository reactionRepository;
  @Mock private UserMissionRepository userMissionRepository;
  @Mock private UserService userService;
  @Mock private BadgeService badgeService;
  @Mock private ImageUploadService imageUploadService;

  private FeedService feedService;

  @BeforeEach
  void setUp() {
    feedService =
        new FeedService(
            verificationRepository,
            confirmRepository,
            reactionRepository,
            userMissionRepository,
            userService,
            badgeService,
            imageUploadService);
  }

  @Test
  void verifyRejectsOtherUsersMission() {
    User owner = User.builder().id(1L).provider("kakao").providerId("owner").build();
    UserMission mission = UserMission.builder().id(10L).user(owner).build();
    when(userMissionRepository.findById(10L)).thenReturn(Optional.of(mission));

    assertThatThrownBy(() -> feedService.verify(2L, 10L, null, "caption"))
        .isInstanceOf(BusinessException.class)
        .hasMessage("접근 권한이 없습니다.");
  }

  @Test
  void verifyRejectsDuplicateVerification() {
    User owner = User.builder().id(1L).provider("kakao").providerId("owner").build();
    UserMission mission = UserMission.builder().id(10L).user(owner).build();
    when(userMissionRepository.findById(10L)).thenReturn(Optional.of(mission));
    when(verificationRepository.existsByUserMissionId(10L)).thenReturn(true);

    assertThatThrownBy(() -> feedService.verify(1L, 10L, null, "caption"))
        .isInstanceOf(BusinessException.class)
        .hasMessage("이미 인증 사진을 올린 미션입니다.");
  }

  @Test
  void confirmRejectsSelfConfirm() {
    User owner = User.builder().id(1L).provider("kakao").providerId("owner").build();
    Verification verification = Verification.builder().id(20L).user(owner).build();
    when(verificationRepository.findById(20L)).thenReturn(Optional.of(verification));

    assertThatThrownBy(() -> feedService.confirm(1L, 20L))
        .isInstanceOf(BusinessException.class)
        .hasMessage("자신의 인증은 확인할 수 없습니다.");
  }

  @Test
  void confirmMarksMissionVerifiedWhenThresholdReached() {
    User owner = User.builder().id(1L).provider("kakao").providerId("owner").level(1).build();
    User confirmer = User.builder().id(2L).provider("kakao").providerId("confirmer").build();
    UserMission mission =
        UserMission.builder()
            .id(10L)
            .user(owner)
            .missionText("산책")
            .missionCategory(MissionCategory.VITALITY)
            .status(MissionStatus.PENDING)
            .build();
    Verification verification =
        Verification.builder().id(20L).user(owner).userMission(mission).build();
    when(verificationRepository.findById(20L)).thenReturn(Optional.of(verification));
    when(confirmRepository.existsByVerificationIdAndUserId(20L, 2L)).thenReturn(false);
    when(userService.getById(2L)).thenReturn(confirmer);
    when(confirmRepository.countByVerificationId(20L)).thenReturn(1L);
    when(userMissionRepository.countByUserIdAndStatus(1L, MissionStatus.VERIFIED)).thenReturn(1L);

    feedService.confirm(2L, 20L);

    assertThat(mission.getStatus()).isEqualTo(MissionStatus.VERIFIED);
    assertThat(mission.getVerifiedAt()).isNotNull();
    verify(userMissionRepository).save(mission);
    verify(userService).levelUp(1L, 1);
    verify(badgeService).checkAndAward(1L);
  }

  @Test
  void reactTogglesExistingReactionOff() {
    User user = User.builder().id(1L).provider("kakao").providerId("user").build();
    Verification verification = Verification.builder().id(20L).build();
    Reaction reaction =
        Reaction.builder().id(30L).verification(verification).user(user).emoji("🔥").build();
    when(verificationRepository.findById(20L)).thenReturn(Optional.of(verification));
    when(reactionRepository.findByVerificationIdAndUserIdAndEmoji(20L, 1L, "🔥"))
        .thenReturn(Optional.of(reaction));

    feedService.react(1L, 20L, "🔥");

    verify(reactionRepository).delete(reaction);
  }

  @Test
  void getFeedReturnsEmptyListWhenUserHasNoTodayMission() {
    when(userMissionRepository.findFirstByUserIdAndAssignedAtBetweenOrderByAssignedAtDesc(
            eq(1L), any(), any()))
        .thenReturn(Optional.empty());

    List<FeedItemResponse> result = feedService.getFeed(1L, 0, 20);

    assertThat(result).isEmpty();
  }

  @Test
  void getFeedQueriesFeedByTodayMissionText() {
    User user = User.builder().id(1L).provider("kakao").providerId("viewer").build();
    UserMission todayMission =
        UserMission.builder()
            .id(10L)
            .user(user)
            .missionText("같은 미션")
            .missionCategory(MissionCategory.VITALITY)
            .status(MissionStatus.PENDING)
            .build();
    when(userMissionRepository.findFirstByUserIdAndAssignedAtBetweenOrderByAssignedAtDesc(
            eq(1L), any(), any()))
        .thenReturn(Optional.of(todayMission));
    when(verificationRepository.findFeedItems(any(), eq(1L), eq("같은 미션"))).thenReturn(List.of());

    List<FeedItemResponse> result = feedService.getFeed(1L, 0, 20);

    assertThat(result).isEmpty();
    verify(verificationRepository).findFeedItems(any(), eq(1L), eq("같은 미션"));
  }
}
