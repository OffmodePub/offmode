package com.offmode.global.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.offmode.global.jwt.JwtAuthFilter;
import com.offmode.global.jwt.JwtProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@ActiveProfiles("prod")
@WebMvcTest(controllers = SecurityConfigTestController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class})
class SecurityConfigProdProfileTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private JwtProvider jwtProvider;

  @Test
  void h2ConsoleRequiresAuthenticationAndKeepsFrameOptionsHeaderInProdProfile() throws Exception {
    mockMvc
        .perform(get("/h2-console/test"))
        .andExpect(status().isUnauthorized())
        .andExpect(header().string("X-Frame-Options", "DENY"));
  }
}
