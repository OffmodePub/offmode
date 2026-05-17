package com.offmode.boundedcontext.feed.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.offmode.boundedcontext.feed.dto.response.FeedItemResponse;
import com.offmode.boundedcontext.feed.entity.Verification;
import com.offmode.boundedcontext.mission.entity.UserMission;
import com.offmode.boundedcontext.mission.repository.UserMissionRepository;
import com.offmode.boundedcontext.mission.types.MissionCategory;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.repository.UserRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;

@DataJpaTest
class VerificationRepositoryTest {

  @Autowired private VerificationRepository verificationRepository;
  @Autowired private UserMissionRepository userMissionRepository;
  @Autowired private UserRepository userRepository;

  @Test
  void findFeedItemsReturnsOnlyVerificationsWithSameMissionText() {
    User viewer = saveUser("viewer");
    User sameMissionUser = saveUser("same");
    User differentMissionUser = saveUser("different");
    saveVerification(sameMissionUser, "물 마시기", "same-caption");
    saveVerification(differentMissionUser, "산책하기", "different-caption");

    List<FeedItemResponse> result =
        verificationRepository.findFeedItems(PageRequest.of(0, 20), viewer.getId(), "물 마시기");

    assertThat(result).extracting(FeedItemResponse::getCaption).containsExactly("same-caption");
    assertThat(result).extracting(FeedItemResponse::getMissionText).containsExactly("물 마시기");
  }

  private User saveUser(String providerId) {
    return userRepository.save(
        User.builder().provider("kakao").providerId(providerId).name(providerId).build());
  }

  private void saveVerification(User user, String missionText, String caption) {
    UserMission mission =
        userMissionRepository.save(
            UserMission.builder()
                .user(user)
                .missionIcon("icon")
                .missionText(missionText)
                .missionCategory(MissionCategory.VITALITY)
                .build());
    verificationRepository.save(
        Verification.builder().user(user).userMission(mission).caption(caption).build());
  }
}
