package com.offmode.boundedcontext.user.service;

import com.offmode.boundedcontext.user.dto.response.BlockResponse;
import com.offmode.boundedcontext.user.dto.response.BlockedUserResponse;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.entity.UserBlock;
import com.offmode.boundedcontext.user.repository.UserBlockRepository;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.status.ErrorStatus;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BlockService {

  private final UserBlockRepository blockRepository;
  private final UserService userService;

  @Transactional
  public BlockResponse block(Long blockerId, Long targetUserId) {
    if (blockerId.equals(targetUserId)) {
      throw new BusinessException(ErrorStatus.USER_SELF_BLOCK_NOT_ALLOWED);
    }

    // 대상 유저 존재 검증 (없으면 USER_NOT_FOUND)
    userService.getById(targetUserId);

    if (blockRepository.existsByBlockerIdAndBlockedId(blockerId, targetUserId)) {
      throw new BusinessException(ErrorStatus.USER_ALREADY_BLOCKED);
    }

    User blocker = userService.getById(blockerId);
    User blocked = userService.getById(targetUserId);
    UserBlock saved =
        blockRepository.save(UserBlock.builder().blocker(blocker).blocked(blocked).build());
    return new BlockResponse(saved.getId());
  }

  @Transactional
  public void unblock(Long blockerId, Long targetUserId) {
    // 존재하지 않아도 조용히 통과 (멱등)
    blockRepository.deleteByBlockerIdAndBlockedId(blockerId, targetUserId);
  }

  @Transactional(readOnly = true)
  public List<BlockedUserResponse> listBlocked(Long blockerId) {
    return blockRepository.findWithBlockedByBlockerId(blockerId).stream()
        .map(
            block -> {
              User blocked = block.getBlocked();
              return new BlockedUserResponse(
                  blocked.getId(), blocked.getName(), blocked.getAvatar());
            })
        .toList();
  }

  @Transactional(readOnly = true)
  public Set<Long> blockedUserIds(Long blockerId) {
    return new HashSet<>(blockRepository.findBlockedIdsByBlockerId(blockerId));
  }
}
