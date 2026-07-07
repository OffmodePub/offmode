package com.offmode.boundedcontext.mission.api.v1;

import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.not;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.offmode.boundedcontext.mission.dto.response.UserMissionResponse;
import com.offmode.boundedcontext.mission.entity.UserMission;
import com.offmode.boundedcontext.mission.service.MissionService;
import com.offmode.boundedcontext.mission.types.MissionCategory;
import com.offmode.boundedcontext.mission.types.MissionStatus;
import com.offmode.global.config.SecurityConfig;
import com.offmode.global.jwt.JwtAuthFilter;
import com.offmode.global.jwt.JwtProvider;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = MissionController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class})
class MissionControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private MissionService missionService;
  @MockitoBean private JwtProvider jwtProvider;

  private void authenticate() {
    when(jwtProvider.isValid("token")).thenReturn(true);
    when(jwtProvider.getUserId("token")).thenReturn(1L);
  }

  @Test
  void todayReturnsMissionResponse() throws Exception {
    authenticate();
    when(missionService.getTodayMissionResponse(1L))
        .thenReturn(
            new UserMissionResponse(
                5L,
                "🚶",
                "동네 한 바퀴 산책하기",
                MissionCategory.VITALITY,
                MissionStatus.PENDING,
                LocalDateTime.of(2026, 7, 7, 8, 0),
                null,
                null,
                null));

    mockMvc
        .perform(get("/api/v1/missions/today").header("Authorization", "Bearer token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(5L))
        .andExpect(jsonPath("$.missionText").value("동네 한 바퀴 산책하기"))
        .andExpect(jsonPath("$.missionCategory").value("Vitality"))
        .andExpect(jsonPath("$.status").value("pending"));
  }

  @Test
  void todayReturnsNoContentWhenMissionNotAssigned() throws Exception {
    authenticate();
    when(missionService.getTodayMissionResponse(1L)).thenReturn(null);

    mockMvc
        .perform(get("/api/v1/missions/today").header("Authorization", "Bearer token"))
        .andExpect(status().isNoContent())
        .andExpect(content().string(""));
  }

  @Test
  void setTodayReturnsUserMissionWithoutUserAssociation() throws Exception {
    authenticate();
    when(missionService.setTodayMission(1L, "🚶", "동네 한 바퀴 산책하기", MissionCategory.VITALITY))
        .thenReturn(
            UserMission.builder()
                .id(7L)
                .missionIcon("🚶")
                .missionText("동네 한 바퀴 산책하기")
                .missionCategory(MissionCategory.VITALITY)
                .status(MissionStatus.PENDING)
                .build());

    mockMvc
        .perform(
            post("/api/v1/missions/today")
                .header("Authorization", "Bearer token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"icon\":\"🚶\",\"text\":\"동네 한 바퀴 산책하기\",\"category\":\"Vitality\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(7L))
        .andExpect(jsonPath("$.missionText").value("동네 한 바퀴 산책하기"))
        .andExpect(jsonPath("$", not(hasKey("user"))));
  }

  @Test
  void setTodayWithBlankIconReturnsValidationError() throws Exception {
    authenticate();

    mockMvc
        .perform(
            post("/api/v1/missions/today")
                .header("Authorization", "Bearer token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"icon\":\"\",\"text\":\"산책하기\",\"category\":\"Vitality\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.isSuccess").value(false))
        .andExpect(jsonPath("$.code").value("VALID_400_001"))
        .andExpect(jsonPath("$.message").value("입력값이 올바르지 않습니다."));
  }

  @Test
  void setTodayWithUnknownCategoryReturnsValidationError() throws Exception {
    authenticate();

    mockMvc
        .perform(
            post("/api/v1/missions/today")
                .header("Authorization", "Bearer token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"icon\":\"🚶\",\"text\":\"산책하기\",\"category\":\"Chaos\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.isSuccess").value(false))
        .andExpect(jsonPath("$.code").value("VALID_400_001"));
  }

  @Test
  void historyReturnsEmptyArrayWith200() throws Exception {
    authenticate();
    when(missionService.getHistory(1L)).thenReturn(List.of());

    mockMvc
        .perform(get("/api/v1/missions/history").header("Authorization", "Bearer token"))
        .andExpect(status().isOk())
        .andExpect(content().json("[]"));
  }

  @Test
  void poolWithoutTokenReturnsUnauthorized() throws Exception {
    mockMvc
        .perform(get("/api/v1/missions/pool"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.isSuccess").value(false))
        .andExpect(jsonPath("$.code").value("COMMON_401"))
        .andExpect(jsonPath("$.message").value("인증이 필요합니다."));
  }
}
