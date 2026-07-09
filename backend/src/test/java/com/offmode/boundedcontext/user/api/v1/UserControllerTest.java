package com.offmode.boundedcontext.user.api.v1;

import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.offmode.boundedcontext.user.dto.response.BlockResponse;
import com.offmode.boundedcontext.user.dto.response.BlockedUserResponse;
import com.offmode.boundedcontext.user.dto.response.UserStatsResponse;
import com.offmode.boundedcontext.user.entity.User;
import com.offmode.boundedcontext.user.service.BlockService;
import com.offmode.boundedcontext.user.service.UserService;
import com.offmode.global.config.SecurityConfig;
import com.offmode.global.exception.BusinessException;
import com.offmode.global.jwt.JwtAuthFilter;
import com.offmode.global.jwt.JwtProvider;
import com.offmode.global.status.ErrorStatus;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = UserController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class})
class UserControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private UserService userService;
  @MockitoBean private BlockService blockService;
  @MockitoBean private JwtProvider jwtProvider;

  private void authenticate() {
    when(jwtProvider.isValid("token")).thenReturn(true);
    when(jwtProvider.getUserId("token")).thenReturn(1L);
  }

  private User user() {
    return User.builder()
        .id(1L)
        .provider("kakao")
        .providerId("p1")
        .name("오프모더")
        .avatar("01")
        .missionHour(8)
        .missionMinute(0)
        .autoRoulette(true)
        .build();
  }

  @Test
  void getMeReturnsUser() throws Exception {
    authenticate();
    when(userService.getById(1L)).thenReturn(user());

    mockMvc
        .perform(get("/api/v1/users/me").header("Authorization", "Bearer token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(1L))
        .andExpect(jsonPath("$.name").value("오프모더"))
        .andExpect(jsonPath("$.avatar").value("01"));
  }

  @Test
  void getMeWithUnknownUserReturnsNotFoundApiResponse() throws Exception {
    authenticate();
    when(userService.getById(1L)).thenThrow(new BusinessException(ErrorStatus.USER_NOT_FOUND));

    mockMvc
        .perform(get("/api/v1/users/me").header("Authorization", "Bearer token"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.isSuccess").value(false))
        .andExpect(jsonPath("$.code").value("USER_404_001"))
        .andExpect(jsonPath("$.message").value("해당 사용자를 찾을 수 없습니다."));
  }

  @Test
  void getStatsReturnsUserStats() throws Exception {
    authenticate();
    when(userService.getStats(1L)).thenReturn(new UserStatsResponse(10, 7, 3, 40, 2, 20, 1, 60, 3));

    mockMvc
        .perform(get("/api/v1/users/me/stats").header("Authorization", "Bearer token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalMissions").value(10))
        .andExpect(jsonPath("$.totalVerified").value(7))
        .andExpect(jsonPath("$.streak").value(3))
        .andExpect(jsonPath("$.vitalityLevel").value(3));
  }

  @Test
  void updateMeReturnsUpdatedUser() throws Exception {
    authenticate();
    when(userService.updateProfile(1L, "새이름", "02", 9, 30, false)).thenReturn(user());

    mockMvc
        .perform(
            put("/api/v1/users/me")
                .header("Authorization", "Bearer token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"name\":\"새이름\",\"avatar\":\"02\",\"missionHour\":9,"
                        + "\"missionMinute\":30,\"autoRoulette\":false}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(1L));
  }

  @Test
  void updateMeWithInvalidMissionHourReturnsValidationError() throws Exception {
    authenticate();

    mockMvc
        .perform(
            put("/api/v1/users/me")
                .header("Authorization", "Bearer token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"missionHour\":25}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.isSuccess").value(false))
        .andExpect(jsonPath("$.code").value("VALID_400_001"))
        .andExpect(jsonPath("$.message").value("입력값이 올바르지 않습니다."));
  }

  @Test
  void deleteMeReturnsNoContent() throws Exception {
    authenticate();
    doNothing().when(userService).deleteAccount(1L);

    mockMvc
        .perform(delete("/api/v1/users/me").header("Authorization", "Bearer token"))
        .andExpect(status().isNoContent())
        .andExpect(content().string(""));
  }

  @Test
  void blockReturnsBlockId() throws Exception {
    authenticate();
    when(blockService.block(1L, 2L)).thenReturn(new BlockResponse(99L));

    mockMvc
        .perform(post("/api/v1/users/2/block").header("Authorization", "Bearer token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.blockId").value(99L));
  }

  @Test
  void unblockReturnsNoContent() throws Exception {
    authenticate();
    doNothing().when(blockService).unblock(1L, 2L);

    mockMvc
        .perform(delete("/api/v1/users/2/block").header("Authorization", "Bearer token"))
        .andExpect(status().isNoContent())
        .andExpect(content().string(""));
  }

  @Test
  void myBlocksReturnsBlockedUsers() throws Exception {
    authenticate();
    when(blockService.listBlocked(1L))
        .thenReturn(List.of(new BlockedUserResponse(2L, "차단이", "03")));

    mockMvc
        .perform(get("/api/v1/users/me/blocks").header("Authorization", "Bearer token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].userId").value(2L))
        .andExpect(jsonPath("$[0].nickname").value("차단이"))
        .andExpect(jsonPath("$[0].avatarId").value("03"));
  }

  @Test
  void getMeWithoutTokenReturnsUnauthorized() throws Exception {
    mockMvc
        .perform(get("/api/v1/users/me"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.isSuccess").value(false))
        .andExpect(jsonPath("$.code").value("COMMON_401"))
        .andExpect(jsonPath("$.message").value("인증이 필요합니다."));
  }
}
