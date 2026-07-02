package com.offmode.boundedcontext.part.service;

import com.offmode.boundedcontext.mission.repository.UserMissionRepository;
import com.offmode.boundedcontext.mission.types.MissionStatus;
import com.offmode.boundedcontext.part.dto.request.PlacementRequest;
import com.offmode.boundedcontext.part.dto.response.PartResponse;
import com.offmode.boundedcontext.part.dto.response.PartResponse.PlacementResponse;
import com.offmode.boundedcontext.part.entity.UserPart;
import com.offmode.boundedcontext.part.repository.UserPartRepository;
import com.offmode.boundedcontext.part.types.PartDefinition;
import com.offmode.boundedcontext.room.repository.RoomProofRepository;
import com.offmode.boundedcontext.room.types.ProofStatus;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.repository.UserRepository;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.status.ErrorStatus;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PartService {

  private final UserPartRepository userPartRepository;
  private final UserMissionRepository userMissionRepository;
  private final RoomProofRepository roomProofRepository;
  private final UserRepository userRepository;

  /** 모든 파츠 정의 + 유저별 해금 상태 + 배치 정보(미배치면 null). */
  public List<PartResponse> getUserParts(Long userId) {
    long verified = countVerified(userId);
    Map<String, UserPart> placed =
        userPartRepository.findByUserId(userId).stream()
            .collect(Collectors.toMap(UserPart::getPartKey, Function.identity()));
    return buildParts(verified, placed);
  }

  /** 캐릭터 레이아웃 전체 교체 저장 후 갱신된 전체 파츠 상태 반환. 각 파츠는 존재하고 해금돼 있어야 한다. */
  @Transactional
  public List<PartResponse> saveLayout(Long userId, List<PlacementRequest> placements) {
    long verified = countVerified(userId);

    // 같은 파츠 중복 배치 방어 — unique(user_id, part_key) 위반 500 대신 명시적 400
    long distinctKeys = placements.stream().map(PlacementRequest::getKey).distinct().count();
    if (distinctKeys != placements.size()) {
      throw new BusinessException(ErrorStatus.PART_DUPLICATE);
    }

    for (PlacementRequest p : placements) {
      PartDefinition def =
          PartDefinition.fromKey(p.getKey())
              .orElseThrow(() -> new BusinessException(ErrorStatus.PART_NOT_FOUND));
      if (!def.isUnlockedBy(verified)) {
        throw new BusinessException(ErrorStatus.PART_NOT_UNLOCKED);
      }
    }

    userPartRepository.deleteByUserId(userId);

    User userRef = placements.isEmpty() ? null : getUserRef(userId);
    List<UserPart> entities =
        placements.stream()
            .map(
                p ->
                    UserPart.builder()
                        .user(userRef)
                        .partKey(p.getKey())
                        .posX(p.getX())
                        .posY(p.getY())
                        .scale(p.getScale())
                        .rotation(p.getRotation())
                        .zIndex(p.getZ())
                        .build())
            .toList();
    if (!entities.isEmpty()) {
      userPartRepository.saveAll(entities);
    }

    Map<String, UserPart> placed =
        entities.stream().collect(Collectors.toMap(UserPart::getPartKey, Function.identity()));
    return buildParts(verified, placed);
  }

  private List<PartResponse> buildParts(long verified, Map<String, UserPart> placed) {
    return Arrays.stream(PartDefinition.values())
        .map(
            def -> {
              UserPart part = placed.get(def.getKey());
              PlacementResponse placement = part == null ? null : PlacementResponse.from(part);
              return new PartResponse(def, def.isUnlockedBy(verified), placement);
            })
        .toList();
  }

  // 누적 인증 수 = 레거시 개인 미션 + Rooms v2 방 인증(RoomProof). UserService 와 동일 기준.
  private long countVerified(Long userId) {
    return userMissionRepository.countByUserIdAndStatus(userId, MissionStatus.VERIFIED)
        + roomProofRepository.countByUserIdAndStatus(userId, ProofStatus.VERIFIED);
  }

  private User getUserRef(Long userId) {
    return userRepository
        .findById(userId)
        .orElseThrow(() -> new BusinessException(ErrorStatus.USER_NOT_FOUND));
  }
}
