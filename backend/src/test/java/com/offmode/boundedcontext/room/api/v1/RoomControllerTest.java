package com.offmode.boundedcontext.room.api.v1;

import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.offmode.boundedcontext.room.dto.request.CreateRoomRequest;
import com.offmode.boundedcontext.room.dto.request.JoinRoomRequest;
import com.offmode.boundedcontext.room.dto.response.ConfirmResponse;
import com.offmode.boundedcontext.room.dto.response.RoomDetailResponse;
import com.offmode.boundedcontext.room.dto.response.RoomListResponse;
import com.offmode.boundedcontext.room.dto.response.RoomReactionSummaryResponse;
import com.offmode.boundedcontext.room.service.RoomMissionService;
import com.offmode.boundedcontext.room.service.RoomProofService;
import com.offmode.boundedcontext.room.service.RoomService;
import com.offmode.boundedcontext.room.types.MemberTodayStatus;
import com.offmode.boundedcontext.room.types.ProofStatus;
import com.offmode.boundedcontext.room.types.RoomIconKey;
import com.offmode.boundedcontext.room.types.RoomType;
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

@WebMvcTest(controllers = RoomController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class})
class RoomControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private RoomService roomService;
  @MockitoBean private RoomMissionService roomMissionService;
  @MockitoBean private RoomProofService roomProofService;
  @MockitoBean private JwtProvider jwtProvider;

  private void authenticate() {
    when(jwtProvider.isValid("token")).thenReturn(true);
    when(jwtProvider.getUserId("token")).thenReturn(1L);
  }

  private RoomDetailResponse detail(Long id, String name) {
    return new RoomDetailResponse(
        id,
        name,
        RoomIconKey.FIRE,
        RoomType.GROUP,
        "INVITE",
        3,
        2,
        true,
        null,
        MemberTodayStatus.NONE,
        null,
        List.of(),
        List.of(),
        List.of(),
        true);
  }

  @Test
  void getMyRoomsReturnsRoomListWithEmptyGroupRooms() throws Exception {
    authenticate();
    when(roomService.getMyRooms(1L)).thenReturn(new RoomListResponse(null, List.of()));

    mockMvc
        .perform(get("/api/v1/rooms").header("Authorization", "Bearer token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.soloRoom").value(nullValue()))
        .andExpect(jsonPath("$.groupRooms").isArray())
        .andExpect(jsonPath("$.groupRooms.length()").value(0));
  }

  @Test
  void getDetailReturnsRoomDetail() throws Exception {
    authenticate();
    when(roomService.getDetail(1L, 10L)).thenReturn(detail(10L, "아침 산책방"));

    mockMvc
        .perform(get("/api/v1/rooms/10").header("Authorization", "Bearer token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(10L))
        .andExpect(jsonPath("$.name").value("아침 산책방"))
        .andExpect(jsonPath("$.iconKey").value("FIRE"))
        .andExpect(jsonPath("$.isOwner").value(true));
  }

  @Test
  void getDetailWithUnknownRoomReturnsNotFoundApiResponse() throws Exception {
    authenticate();
    when(roomService.getDetail(1L, 99L))
        .thenThrow(new BusinessException(ErrorStatus.ROOM_NOT_FOUND));

    mockMvc
        .perform(get("/api/v1/rooms/99").header("Authorization", "Bearer token"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.isSuccess").value(false))
        .andExpect(jsonPath("$.code").value("ROOM_404_001"))
        .andExpect(jsonPath("$.message").value("방을 찾을 수 없습니다."));
  }

  @Test
  void createRoomReturnsRoomDetail() throws Exception {
    authenticate();
    when(roomService.createRoom(eq(1L), any(CreateRoomRequest.class)))
        .thenReturn(detail(11L, "새 방"));

    mockMvc
        .perform(
            post("/api/v1/rooms")
                .header("Authorization", "Bearer token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"새 방\",\"iconKey\":\"FIRE\",\"type\":\"GROUP\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(11L))
        .andExpect(jsonPath("$.name").value("새 방"));
  }

  @Test
  void createRoomWithBlankNameReturnsValidationError() throws Exception {
    authenticate();

    mockMvc
        .perform(
            post("/api/v1/rooms")
                .header("Authorization", "Bearer token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"\",\"iconKey\":\"FIRE\",\"type\":\"GROUP\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.isSuccess").value(false))
        .andExpect(jsonPath("$.code").value("VALID_400_001"))
        .andExpect(jsonPath("$.message").value("입력값이 올바르지 않습니다."));
  }

  @Test
  void joinAlreadyJoinedRoomReturnsConflictApiResponse() throws Exception {
    authenticate();
    when(roomService.join(eq(1L), any(JoinRoomRequest.class)))
        .thenThrow(new BusinessException(ErrorStatus.ROOM_ALREADY_JOINED));

    mockMvc
        .perform(
            post("/api/v1/rooms/join")
                .header("Authorization", "Bearer token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"inviteCode\":\"INVITE\"}"))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.isSuccess").value(false))
        .andExpect(jsonPath("$.code").value("ROOM_409_001"))
        .andExpect(jsonPath("$.message").value("이미 참여한 방입니다."));
  }

  @Test
  void confirmReturnsConfirmResponse() throws Exception {
    authenticate();
    when(roomProofService.confirm(1L, 10L, 20L))
        .thenReturn(new ConfirmResponse(2, 2, ProofStatus.VERIFIED));

    mockMvc
        .perform(post("/api/v1/rooms/10/proofs/20/confirm").header("Authorization", "Bearer token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.confirmCount").value(2))
        .andExpect(jsonPath("$.requiredConfirm").value(2))
        .andExpect(jsonPath("$.status").value("VERIFIED"));
  }

  @Test
  void toggleReactionReturnsReactionSummaries() throws Exception {
    authenticate();
    when(roomProofService.toggleReaction(1L, 10L, 20L, "🔥"))
        .thenReturn(List.of(new RoomReactionSummaryResponse("🔥", 3, true)));

    mockMvc
        .perform(
            post("/api/v1/rooms/10/proofs/20/reactions")
                .header("Authorization", "Bearer token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"emoji\":\"🔥\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].emoji").value("🔥"))
        .andExpect(jsonPath("$[0].count").value(3))
        .andExpect(jsonPath("$[0].mine").value(true));
  }

  @Test
  void getMyRoomsWithoutTokenReturnsUnauthorized() throws Exception {
    mockMvc
        .perform(get("/api/v1/rooms"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.isSuccess").value(false))
        .andExpect(jsonPath("$.code").value("COMMON_401"))
        .andExpect(jsonPath("$.message").value("인증이 필요합니다."));
  }
}
