package com.offmode.boundedcontext.part.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.offmode.boundedcontext.mission.repository.UserMissionRepository;
import com.offmode.boundedcontext.mission.types.MissionStatus;
import com.offmode.boundedcontext.part.dto.response.PartResponse;
import com.offmode.boundedcontext.part.entity.UserPart;
import com.offmode.boundedcontext.part.repository.UserPartRepository;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.repository.UserRepository;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.status.ErrorStatus;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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

  @Test
  void getUserPartsReflectsUnlockThresholdsAndEquippedKey() {
    when(userMissionRepository.countByUserIdAndStatus(1L, MissionStatus.VERIFIED)).thenReturn(7L);
    when(userPartRepository.findByUserId(1L))
        .thenReturn(Optional.of(UserPart.builder().equippedKey("crown").build()));

    List<PartResponse> parts = service().getUserParts(1L);

    assertThat(parts).hasSize(16);
    assertThat(find(parts, "heart").isUnlocked()).isTrue(); // threshold 7
    assertThat(find(parts, "ribbon").isUnlocked()).isFalse(); // threshold 10
    assertThat(find(parts, "comingSoon14").isUnlocked()).isFalse(); // 항상 잠김
    assertThat(find(parts, "crown").isEquipped()).isTrue();
    assertThat(find(parts, "heart").isEquipped()).isFalse();
  }

  @Test
  void equipUnlockedPartSavesAndReturnsUpdatedState() {
    User user = User.builder().id(1L).provider("kakao").providerId("p1").build();
    when(userMissionRepository.countByUserIdAndStatus(1L, MissionStatus.VERIFIED)).thenReturn(5L);
    when(userPartRepository.findByUserId(1L)).thenReturn(Optional.empty());
    when(userRepository.findById(1L)).thenReturn(Optional.of(user));
    when(userPartRepository.save(any(UserPart.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    List<PartResponse> parts = service().equip(1L, "twinkle");

    assertThat(find(parts, "twinkle").isEquipped()).isTrue(); // threshold 5, unlocked
  }

  @Test
  void equipBlankKeyUnequipsInsteadOfRejecting() {
    when(userMissionRepository.countByUserIdAndStatus(1L, MissionStatus.VERIFIED)).thenReturn(5L);
    when(userPartRepository.findByUserId(1L))
        .thenReturn(Optional.of(UserPart.builder().equippedKey("twinkle").build()));
    when(userPartRepository.save(any(UserPart.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    List<PartResponse> parts = service().equip(1L, ""); // 빈 문자열 = 해제

    assertThat(find(parts, "twinkle").isEquipped()).isFalse();
  }

  @Test
  void unequipWithNoExistingRowDoesNotCreateRow() {
    when(userMissionRepository.countByUserIdAndStatus(1L, MissionStatus.VERIFIED)).thenReturn(5L);
    when(userPartRepository.findByUserId(1L)).thenReturn(Optional.empty());

    List<PartResponse> parts = service().equip(1L, null);

    assertThat(parts).hasSize(16);
    assertThat(parts).noneMatch(PartResponse::isEquipped);
    verify(userPartRepository, never()).save(any(UserPart.class));
  }

  @Test
  void equipLockedPartThrows() {
    when(userMissionRepository.countByUserIdAndStatus(1L, MissionStatus.VERIFIED)).thenReturn(5L);

    assertThatThrownBy(() -> service().equip(1L, "star")) // threshold 13
        .isInstanceOfSatisfying(
            BusinessException.class,
            e -> assertThat(e.getErrorStatus()).isEqualTo(ErrorStatus.PART_NOT_UNLOCKED));
  }

  @Test
  void equipUnknownKeyThrows() {
    assertThatThrownBy(() -> service().equip(1L, "nope"))
        .isInstanceOfSatisfying(
            BusinessException.class,
            e -> assertThat(e.getErrorStatus()).isEqualTo(ErrorStatus.PART_NOT_FOUND));
  }
}
