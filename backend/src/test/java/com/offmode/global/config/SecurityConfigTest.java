package com.offmode.global.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.offmode.global.jwt.JwtAuthFilter;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

class SecurityConfigTest {

  @Test
  void corsUsesConfiguredAllowedOrigins() {
    MockEnvironment environment =
        new MockEnvironment()
            .withProperty(
                "offmode.security.cors.allowed-origins",
                "https://offmode.example.com,https://www.offmode.example.com");
    SecurityConfig config = createSecurityConfig(environment);

    CorsConfiguration corsConfiguration = getCorsConfiguration(config);

    assertThat(corsConfiguration.getAllowedOrigins())
        .containsExactly("https://offmode.example.com", "https://www.offmode.example.com");
    assertThat(corsConfiguration.getAllowedOriginPatterns()).isEmpty();
    assertThat(corsConfiguration.getAllowCredentials()).isTrue();
  }

  @Test
  void corsUsesConfiguredAllowedOriginPatterns() {
    MockEnvironment environment =
        new MockEnvironment()
            .withProperty("offmode.security.cors.allowed-origin-patterns", "http://localhost:*");
    environment.setActiveProfiles("dev");
    SecurityConfig config = createSecurityConfig(environment);

    CorsConfiguration corsConfiguration = getCorsConfiguration(config);

    assertThat(corsConfiguration.getAllowedOrigins()).isEmpty();
    assertThat(corsConfiguration.getAllowedOriginPatterns()).containsExactly("http://localhost:*");
  }

  @Test
  void corsIgnoresAllowedOriginPatternsOutsideDevProfile() {
    MockEnvironment environment =
        new MockEnvironment().withProperty("offmode.security.cors.allowed-origin-patterns", "*");
    environment.setActiveProfiles("prod");
    SecurityConfig config = createSecurityConfig(environment);

    CorsConfiguration corsConfiguration = getCorsConfiguration(config);

    assertThat(corsConfiguration.getAllowedOriginPatterns()).isEmpty();
  }

  private SecurityConfig createSecurityConfig(MockEnvironment environment) {
    return new SecurityConfig(mock(JwtAuthFilter.class), new ObjectMapper(), environment);
  }

  private CorsConfiguration getCorsConfiguration(SecurityConfig config) {
    UrlBasedCorsConfigurationSource source = (UrlBasedCorsConfigurationSource) config.corsSource();
    CorsConfiguration corsConfiguration = source.getCorsConfigurations().get("/**");
    assertThat(corsConfiguration).isNotNull();
    return corsConfiguration;
  }
}
