package com.offmode.global.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.offmode.global.jwt.JwtAuthFilter;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

class SecurityConfigTest {

  @Test
  void publicEndpointsIncludeH2ConsoleOnlyInDevProfile() {
    MockEnvironment devEnvironment = new MockEnvironment();
    devEnvironment.setActiveProfiles("dev");
    MockEnvironment prodEnvironment = new MockEnvironment();
    prodEnvironment.setActiveProfiles("prod");
    SecurityConfig devConfig = createSecurityConfig(devEnvironment);
    SecurityConfig prodConfig = createSecurityConfig(prodEnvironment);

    String[] devEndpoints = ReflectionTestUtils.invokeMethod(devConfig, "getPublicEndpoints");
    String[] prodEndpoints = ReflectionTestUtils.invokeMethod(prodConfig, "getPublicEndpoints");

    assertThat(devEndpoints).contains("/h2-console/**");
    assertThat(prodEndpoints).doesNotContain("/h2-console/**");
  }

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
    SecurityConfig config = createSecurityConfig(environment);

    CorsConfiguration corsConfiguration = getCorsConfiguration(config);

    assertThat(corsConfiguration.getAllowedOrigins()).isEmpty();
    assertThat(corsConfiguration.getAllowedOriginPatterns()).containsExactly("http://localhost:*");
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
