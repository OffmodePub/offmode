package com.offmode.boundedcontext.part.service;

import com.offmode.boundedcontext.mission.repository.UserMissionRepository;
import com.offmode.boundedcontext.mission.types.MissionStatus;
import com.offmode.boundedcontext.part.dto.response.PartResponse;
import com.offmode.boundedcontext.part.entity.UserPart;
import com.offmode.boundedcontext.part.repository.UserPartRepository;
import com.offmode.boundedcontext.part.types.PartDefinition;
import com.offmode.boundedcontext.user.repository.UserRepository;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.status.ErrorStatus;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PartService {

  private final UserPartRepository userPartRepository;
  private final UserMissionRepository userMissionRepository;
  private final UserRepository userRepository;

  /** 모든 파츠 정의 + 유저별 해금/장착 상태. */
  public List<PartResponse> getUserParts(Long userId) {
    long verified = countVerified(userId);
    String equippedKey =
        userPartRepository.findByUserId(userId).map(UserPart::getEquippedKey).orElse(null);

    return Arrays.stream(PartDefinition.values())
        .map(
            def ->
                new PartResponse(def, def.isUnlockedBy(verified), def.getKey().equals(equippedKey)))
        .toList();
  }

  /** 파츠 장착/해제 후 갱신된 전체 파츠 상태 반환. equippedKey 가 null 이면 해제. */
  @Transactional
  public List<PartResponse> equip(Long userId, String equippedKey) {
    if (equippedKey != null) {
      PartDefinition def =
          PartDefinition.fromKey(equippedKey)
              .orElseThrow(() -> new BusinessException(ErrorStatus.PART_NOT_FOUND));
      if (!def.isUnlockedBy(countVerified(userId))) {
        throw new BusinessException(ErrorStatus.PART_NOT_UNLOCKED);
      }
    }

    UserPart userPart =
        userPartRepository
            .findByUserId(userId)
            .orElseGet(
                () -> UserPart.builder().user(userRepository.getReferenceById(userId)).build());
    userPart.updateEquippedKey(equippedKey);
    userPartRepository.save(userPart);

    return getUserParts(userId);
  }

  private long countVerified(Long userId) {
    return userMissionRepository.countByUserIdAndStatus(userId, MissionStatus.VERIFIED);
  }
}
