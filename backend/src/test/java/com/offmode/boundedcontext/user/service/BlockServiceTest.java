package com.offmode.boundedcontext.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.offmode.boundedcontext.user.dto.response.BlockResponse;
import com.offmode.boundedcontext.user.dto.response.BlockedUserResponse;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.entity.UserBlock;
import com.offmode.boundedcontext.user.repository.UserBlockRepository;
import com.offmode.global.exception.BusinessException;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BlockServiceTest {

  @Mock private UserBlockRepository blockRepository;
  @Mock private UserService userService;

  private BlockService service() {
    return new BlockService(blockRepository, userService);
  }

  private User user(Long id, String name, String avatar) {
    return User.builder()
        .id(id)
        .provider("kakao")
        .providerId("p" + id)
        .name(name)
        .avatar(avatar)
        .build();
  }

  @Test
  void blockRejectsBlockingYourself() {
    assertThatThrownBy(() -> service().block(1L, 1L))
        .isInstanceOf(BusinessException.class)
        .hasMessage("자기 자신은 차단할 수 없습니다.");
  }

  @Test
  void blockRejectsAlreadyBlockedUser() {
    when(userService.getById(2L)).thenReturn(user(2L, "대상", "02"));
    when(blockRepository.existsByBlockerIdAndBlockedId(1L, 2L)).thenReturn(true);

    assertThatThrownBy(() -> service().block(1L, 2L))
        .isInstanceOf(BusinessException.class)
        .hasMessage("이미 차단한 사용자입니다.");
  }

  @Test
  void blockSavesAndReturnsBlockId() {
    when(userService.getById(2L)).thenReturn(user(2L, "대상", "02"));
    when(userService.getById(1L)).thenReturn(user(1L, "나", "01"));
    when(blockRepository.existsByBlockerIdAndBlockedId(1L, 2L)).thenReturn(false);
    when(blockRepository.save(any(UserBlock.class)))
        .thenAnswer(
            invocation -> {
              UserBlock arg = invocation.getArgument(0);
              arg.setId(99L);
              return arg;
            });

    BlockResponse response = service().block(1L, 2L);

    assertThat(response.blockId()).isEqualTo(99L);
    verify(blockRepository).save(any(UserBlock.class));
  }

  @Test
  void unblockIsIdempotent() {
    service().unblock(1L, 2L);
    verify(blockRepository).deleteByBlockerIdAndBlockedId(1L, 2L);
  }

  @Test
  void listBlockedMapsBlockedUsers() {
    UserBlock block =
        UserBlock.builder()
            .id(5L)
            .blocker(user(1L, "나", "01"))
            .blocked(user(2L, "차단이", "03"))
            .build();
    when(blockRepository.findWithBlockedByBlockerId(1L)).thenReturn(List.of(block));

    List<BlockedUserResponse> result = service().listBlocked(1L);

    assertThat(result).hasSize(1);
    assertThat(result.getFirst().userId()).isEqualTo(2L);
    assertThat(result.getFirst().nickname()).isEqualTo("차단이");
    assertThat(result.getFirst().avatarId()).isEqualTo("03");
  }

  @Test
  void blockedUserIdsReturnsSet() {
    when(blockRepository.findBlockedIdsByBlockerId(1L)).thenReturn(List.of(2L, 3L));

    Set<Long> ids = service().blockedUserIds(1L);

    assertThat(ids).containsExactlyInAnyOrder(2L, 3L);
  }
}
