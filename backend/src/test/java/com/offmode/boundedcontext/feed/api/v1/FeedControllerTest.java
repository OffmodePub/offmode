package com.offmode.boundedcontext.feed.api.v1;

import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.offmode.boundedcontext.feed.entity.Verification;
import com.offmode.boundedcontext.feed.service.FeedService;
import com.offmode.global.config.SecurityConfig;
import com.offmode.global.jwt.JwtAuthFilter;
import com.offmode.global.jwt.JwtProvider;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.multipart.MultipartFile;

@WebMvcTest(controllers = FeedController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class})
class FeedControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private FeedService feedService;
  @MockitoBean private JwtProvider jwtProvider;

  @Test
  void verifyReturnsResponseDtoWithoutLazyAssociations() throws Exception {
    when(jwtProvider.isValid("token")).thenReturn(true);
    when(jwtProvider.getUserId("token")).thenReturn(1L);
    when(feedService.verify(eq(1L), eq(10L), any(MultipartFile.class), eq("caption")))
        .thenReturn(
            Verification.builder()
                .id(20L)
                .photoUrl("https://cdn.example.com/verification.jpg")
                .caption("caption")
                .createdAt(LocalDateTime.of(2026, 5, 18, 12, 0))
                .build());

    mockMvc
        .perform(
            multipart("/api/v1/feed/verify")
                .file("photo", "image".getBytes())
                .param("userMissionId", "10")
                .param("caption", "caption")
                .header("Authorization", "Bearer token"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(20L))
        .andExpect(jsonPath("$.photoUrl").value("https://cdn.example.com/verification.jpg"))
        .andExpect(jsonPath("$.caption").value("caption"))
        .andExpect(jsonPath("$", not(hasKey("user"))))
        .andExpect(jsonPath("$", not(hasKey("userMission"))));
  }
}
