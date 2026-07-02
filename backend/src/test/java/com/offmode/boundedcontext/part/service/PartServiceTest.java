package com.offmode.boundedcontext.part.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.offmode.boundedcontext.mission.repository.UserMissionRepository;
import com.offmode.boundedcontext.mission.types.MissionStatus;
import com.offmode.boundedcontext.part.dto.request.PlacementRequest;
import com.offmode.boundedcontext.part.dto.response.PartResponse;
import com.offmode.boundedcontext.part.entity.UserPart;
import com.offmode.boundedcontext.part.repository.UserPartRepository;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.repository.UserRepository;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.status.ErrorStatus;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class PartServiceTest {

  @Mock private UserPartRepository userPartRepository;
  @Mock private UserMissionRepository userMissionRepository;
  @Mock private UserRepository userRepository;

  private PartService service() {
    return new PartService(userPartRepository, userMissionRepository, userRepository);
  }

  private PartResponse find(List<PartResponse> parts, String key) {
    return parts.stream().filter(p -> p.getKey().equals(key)).findFirst().orElseThrow();
  }

  private PlacementRequest placement(String key, double x, double y, double scale, int z) {
    PlacementRequest req = new PlacementRequest();
    ReflectionTestUtils.setField(req, "key", key);
    ReflectionTestUtils.setField(req, "x", x);
    ReflectionTestUtils.setField(req, "y", y);
    ReflectionTestUtils.setField(req, "scale", scale);
    ReflectionTestUtils.setField(req, "rotation", 0.0);
    ReflectionTestUtils.setField(req, "z", z);
    return req;
  }

  @Test
  void getUserPartsReflectsUnlockThresholdsAndPlacements() {
    when(userMissionRepository.countByUserIdAndStatus(1L, MissionStatus.VERIFIED)).thenReturn(7L);
    when(userPartRepository.findByUserId(1L))
        .thenReturn(
            List.of(
                UserPart.builder()
                    .partKey("crown")
                    .posX(0.2)
                    .posY(0.8)
                    .scale(1.5)
                    .rotation(30.0)
                    .zIndex(2)
                    .build()));

    List<PartResponse> parts = service().getUserParts(1L);

    assertThat(parts).hasSize(16);
    assertThat(find(parts, "heart").isUnlocked()).isTrue(); // threshold 7
    assertThat(find(parts, "ribbon").isUnlocked()).isFalse(); // threshold 10
    assertThat(find(parts, "comingSoon14").isUnlocked()).isFalse(); // 항상 잠김

    PartResponse crown = find(parts, "crown");
    assertThat(crown.getPlacement()).isNotNull();
    assertThat(crown.getPlacement().x()).isEqualTo(0.2);
    assertThat(crown.getPlacement().y()).isEqualTo(0.8);
    assertThat(crown.getPlacement().scale()).isEqualTo(1.5);
    assertThat(crown.getPlacement().rotation()).isEqualTo(30.0);
    assertThat(crown.getPlacement().z()).isEqualTo(2);
    assertThat(find(parts, "heart").getPlacement()).isNull();
  }

  @Test
  void saveLayoutReplacesAllPlacements() {
    User user = User.builder().id(1L).provider("kakao").providerId("p1").build();
    when(userMissionRepository.countByUserIdAndStatus(1L, MissionStatus.VERIFIED)).thenReturn(7L);
    when(userRepository.findById(1L)).thenReturn(java.util.Optional.of(user));
    when(userPartRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

    List<PlacementRequest> placements =
        List.of(placement("leaf", 0.1, 0.2, 1.0, 0), placement("crown", 0.5, 0.5, 1.2, 1));

    List<PartResponse> parts = service().saveLayout(1L, placements);

    verify(userPartRepository).deleteByUserId(1L);
    verify(userPartRepository).saveAll(anyList());
    assertThat(find(parts, "leaf").getPlacement()).isNotNull();
    assertThat(find(parts, "leaf").getPlacement().x()).isEqualTo(0.1);
    assertThat(find(parts, "crown").getPlacement()).isNotNull();
    assertThat(find(parts, "star").getPlacement()).isNull(); // 배치 안 함
  }

  @Test
  void saveLayoutRejectsLockedPart() {
    when(userMissionRepository.countByUserIdAndStatus(1L, MissionStatus.VERIFIED)).thenReturn(5L);

    List<PlacementRequest> placements =
        List.of(placement("star", 0.5, 0.5, 1.0, 0)); // threshold 13

    assertThatThrownBy(() -> service().saveLayout(1L, placements))
        .isInstanceOfSatisfying(
            BusinessException.class,
            e -> assertThat(e.getErrorStatus()).isEqualTo(ErrorStatus.PART_NOT_UNLOCKED));

    verify(userPartRepository, never()).deleteByUserId(any());
    verify(userPartRepository, never()).saveAll(anyList());
  }

  @Test
  void saveLayoutRejectsUnknownKey() {
    when(userMissionRepository.countByUserIdAndStatus(1L, MissionStatus.VERIFIED)).thenReturn(50L);

    List<PlacementRequest> placements = List.of(placement("nope", 0.5, 0.5, 1.0, 0));

    assertThatThrownBy(() -> service().saveLayout(1L, placements))
        .isInstanceOfSatisfying(
            BusinessException.class,
            e -> assertThat(e.getErrorStatus()).isEqualTo(ErrorStatus.PART_NOT_FOUND));

    verify(userPartRepository, never()).deleteByUserId(any());
  }

  @Test
  void saveLayoutRejectsDuplicateKey() {
    when(userMissionRepository.countByUserIdAndStatus(1L, MissionStatus.VERIFIED)).thenReturn(5L);

    List<PlacementRequest> placements =
        List.of(placement("leaf", 0.1, 0.2, 1.0, 0), placement("leaf", 0.5, 0.5, 1.0, 1));

    assertThatThrownBy(() -> service().saveLayout(1L, placements))
        .isInstanceOfSatisfying(
            BusinessException.class,
            e -> assertThat(e.getErrorStatus()).isEqualTo(ErrorStatus.PART_DUPLICATE));

    verify(userPartRepository, never()).deleteByUserId(any());
    verify(userPartRepository, never()).saveAll(anyList());
  }

  @Test
  void saveLayoutWithEmptyClearsWithoutTouchingUser() {
    when(userMissionRepository.countByUserIdAndStatus(1L, MissionStatus.VERIFIED)).thenReturn(5L);

    List<PartResponse> parts = service().saveLayout(1L, List.of());

    verify(userPartRepository).deleteByUserId(1L);
    verify(userPartRepository, never()).saveAll(anyList());
    assertThat(parts).hasSize(16);
    assertThat(parts).allMatch(p -> p.getPlacement() == null);
  }
}
