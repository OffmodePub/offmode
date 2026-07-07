package com.offmode.boundedcontext.part.api.v1;

import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.offmode.boundedcontext.part.dto.response.PartResponse;
import com.offmode.boundedcontext.part.service.PartService;
import com.offmode.boundedcontext.part.types.PartDefinition;
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

@WebMvcTest(controllers = PartController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class})
class PartControllerTest {

  private static final String LAYOUT_BODY =
      "{\"placements\":[{\"key\":\"leaf\",\"x\":0.5,\"y\":0.5,\"scale\":1.0,\"rotation\":0,\"z\":1}]}";

  @Autowired private MockMvc mockMvc;

  @MockitoBean private PartService partService;
  @MockitoBean private JwtProvider jwtProvider;

  private void authenticate() {
    when(jwtProvider.isValid("token")).thenReturn(true);
    when(jwtProvider.getUserId("token")).thenReturn(1L);
  }

  @Test
  void getMyPartsReturnsPartList() throws Exception {
    authenticate();
    when(partService.getUserParts(1L))
        .thenReturn(
            List.of(
                new PartResponse(
                    PartDefinition.LEAF,
                    true,
                    new PartResponse.PlacementResponse(0.5, 0.5, 1.0, 0, 1)),
                new PartResponse(PartDefinition.CROWN, false, null)));

    mockMvc
        .perform(get("/api/v1/parts/me").header("Authorization", "Bearer token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[0].key").value("leaf"))
        .andExpect(jsonPath("$[0].unlocked").value(true))
        .andExpect(jsonPath("$[0].placement.x").value(0.5))
        .andExpect(jsonPath("$[1].key").value("crown"))
        .andExpect(jsonPath("$[1].unlocked").value(false));
  }

  @Test
  void getMyPartsReturnsEmptyArrayWith200() throws Exception {
    authenticate();
    when(partService.getUserParts(1L)).thenReturn(List.of());

    mockMvc
        .perform(get("/api/v1/parts/me").header("Authorization", "Bearer token"))
        .andExpect(status().isOk())
        .andExpect(content().json("[]"));
  }

  @Test
  void saveLayoutReturnsUpdatedParts() throws Exception {
    authenticate();
    when(partService.saveLayout(eq(1L), anyList()))
        .thenReturn(
            List.of(
                new PartResponse(
                    PartDefinition.LEAF,
                    true,
                    new PartResponse.PlacementResponse(0.5, 0.5, 1.0, 0, 1))));

    mockMvc
        .perform(
            put("/api/v1/parts/layout")
                .header("Authorization", "Bearer token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(LAYOUT_BODY))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].key").value("leaf"))
        .andExpect(jsonPath("$[0].placement.z").value(1));
  }

  @Test
  void saveLayoutWithoutPlacementsReturnsValidationError() throws Exception {
    authenticate();

    mockMvc
        .perform(
            put("/api/v1/parts/layout")
                .header("Authorization", "Bearer token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.isSuccess").value(false))
        .andExpect(jsonPath("$.code").value("VALID_400_001"))
        .andExpect(jsonPath("$.message").value("입력값이 올바르지 않습니다."));
  }

  @Test
  void saveLayoutWithLockedPartReturnsBadRequestApiResponse() throws Exception {
    authenticate();
    when(partService.saveLayout(eq(1L), anyList()))
        .thenThrow(new BusinessException(ErrorStatus.PART_NOT_UNLOCKED));

    mockMvc
        .perform(
            put("/api/v1/parts/layout")
                .header("Authorization", "Bearer token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(LAYOUT_BODY))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.isSuccess").value(false))
        .andExpect(jsonPath("$.code").value("PART_400_001"))
        .andExpect(jsonPath("$.message").value("아직 해금되지 않은 파츠입니다."));
  }

  @Test
  void getMyPartsWithoutTokenReturnsUnauthorized() throws Exception {
    mockMvc
        .perform(get("/api/v1/parts/me"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.isSuccess").value(false))
        .andExpect(jsonPath("$.code").value("COMMON_401"));
  }
}
