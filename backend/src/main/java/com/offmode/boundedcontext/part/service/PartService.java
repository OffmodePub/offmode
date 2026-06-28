package com.offmode.boundedcontext.part.service;

import com.offmode.boundedcontext.mission.repository.UserMissionRepository;
import com.offmode.boundedcontext.mission.types.MissionStatus;
import com.offmode.boundedcontext.part.dto.response.PartResponse;
import com.offmode.boundedcontext.part.entity.UserPart;
import com.offmode.boundedcontext.part.repository.UserPartRepository;
import com.offmode.boundedcontext.part.types.PartDefinition;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.repository.UserRepository;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.status.ErrorStatus;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
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
    return buildParts(verified, equippedKey);
  }

  /** 파츠 장착/해제 후 갱신된 전체 파츠 상태 반환. equippedKey 가 null 또는 빈 문자열이면 해제로 처리한다. */
  @Transactional
  public List<PartResponse> equip(Long userId, String equippedKey) {
    long verified = countVerified(userId);
    String targetKey = (equippedKey != null && !equippedKey.isBlank()) ? equippedKey : null;

    if (targetKey != null) {
      PartDefinition def =
          PartDefinition.fromKey(targetKey)
              .orElseThrow(() -> new BusinessException(ErrorStatus.PART_NOT_FOUND));
      if (!def.isUnlockedBy(verified)) {
        throw new BusinessException(ErrorStatus.PART_NOT_UNLOCKED);
      }
    }

    Optional<UserPart> existing = userPartRepository.findByUserId(userId);

    // 장착 이력이 없는데 해제 요청 → 불필요한 빈 행을 만들지 않고 현재 상태 그대로 반환
    if (existing.isEmpty() && targetKey == null) {
      return buildParts(verified, null);
    }

    UserPart userPart =
        existing.orElseGet(() -> UserPart.builder().user(getUserRef(userId)).build());
    userPart.updateEquippedKey(targetKey);
    userPartRepository.save(userPart);

    return buildParts(verified, targetKey);
  }

  private List<PartResponse> buildParts(long verified, String equippedKey) {
    return Arrays.stream(PartDefinition.values())
        .map(
            def ->
                new PartResponse(def, def.isUnlockedBy(verified), def.getKey().equals(equippedKey)))
        .toList();
  }

  private long countVerified(Long userId) {
    return userMissionRepository.countByUserIdAndStatus(userId, MissionStatus.VERIFIED);
  }

  private User getUserRef(Long userId) {
    return userRepository
        .findById(userId)
        .orElseThrow(() -> new BusinessException(ErrorStatus.USER_NOT_FOUND));
  }
}
