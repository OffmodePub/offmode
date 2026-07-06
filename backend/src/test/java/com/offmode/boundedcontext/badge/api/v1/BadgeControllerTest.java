package com.offmode.boundedcontext.badge.api.v1;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.offmode.boundedcontext.badge.dto.response.BadgeResponse;
import com.offmode.boundedcontext.badge.entity.UserBadge;
import com.offmode.boundedcontext.badge.service.BadgeService;
import com.offmode.boundedcontext.badge.types.BadgeDefinition;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = BadgeController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class})
class BadgeControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private BadgeService badgeService;
  @MockitoBean private JwtProvider jwtProvider;

  private void authenticate() {
    when(jwtProvider.isValid("token")).thenReturn(true);
    when(jwtProvider.getUserId("token")).thenReturn(1L);
  }

  @Test
  void getMyBadgesReturnsBadgeList() throws Exception {
    authenticate();
    when(badgeService.getUserBadges(1L))
        .thenReturn(
            List.of(
                new BadgeResponse(BadgeDefinition.EXPLORER_LV01, new UserBadge()),
                new BadgeResponse(BadgeDefinition.WALKER, null)));

    mockMvc
        .perform(get("/api/v1/badges/me").header("Authorization", "Bearer token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[0].key").value("explorer_lv01"))
        .andExpect(jsonPath("$[0].earned").value(true))
        .andExpect(jsonPath("$[1].key").value("activity_walker"))
        .andExpect(jsonPath("$[1].earned").value(false));
  }

  @Test
  void getMyBadgesReturnsEmptyArrayWith200() throws Exception {
    authenticate();
    when(badgeService.getUserBadges(1L)).thenReturn(List.of());

    mockMvc
        .perform(get("/api/v1/badges/me").header("Authorization", "Bearer token"))
        .andExpect(status().isOk())
        .andExpect(content().json("[]"));
  }

  @Test
  void getMyBadgesWithUnknownUserReturnsNotFoundApiResponse() throws Exception {
    authenticate();
    when(badgeService.getUserBadges(1L))
        .thenThrow(new BusinessException(ErrorStatus.USER_NOT_FOUND));

    mockMvc
        .perform(get("/api/v1/badges/me").header("Authorization", "Bearer token"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.isSuccess").value(false))
        .andExpect(jsonPath("$.code").value("USER_404_001"))
        .andExpect(jsonPath("$.message").value("해당 사용자를 찾을 수 없습니다."));
  }

  @Test
  void getMyBadgesWithoutTokenReturnsUnauthorized() throws Exception {
    mockMvc
        .perform(get("/api/v1/badges/me"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.isSuccess").value(false))
        .andExpect(jsonPath("$.code").value("COMMON_401"))
        .andExpect(jsonPath("$.message").value("인증이 필요합니다."));
  }
}
