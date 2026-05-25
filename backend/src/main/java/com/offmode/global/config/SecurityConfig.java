package com.offmode.global.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.offmode.global.dto.response.ApiResponse;
import com.offmode.global.jwt.JwtAuthFilter;
import com.offmode.global.status.ErrorStatus;
import jakarta.servlet.http.HttpServletResponse;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer.FrameOptionsConfig;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

  private final JwtAuthFilter jwtAuthFilter;
  private final ObjectMapper objectMapper;
  private final Environment environment;

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.csrf(AbstractHttpConfigurer::disable)
        .cors(cors -> cors.configurationSource(corsSource()))
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers(getPublicEndpoints()).permitAll().anyRequest().authenticated())
        .exceptionHandling(
            exception ->
                exception
                    .authenticationEntryPoint(
                        (request, response, authException) ->
                            writeErrorResponse(response, ErrorStatus.UNAUTHORIZED))
                    .accessDeniedHandler(
                        (request, response, accessDeniedException) ->
                            writeErrorResponse(response, ErrorStatus.AUTH_ACCESS_DENIED)))
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

    if (isDevProfile()) {
      http.headers(h -> h.frameOptions(FrameOptionsConfig::disable));
    }

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(getCorsAllowedOrigins());
    config.setAllowedOriginPatterns(getCorsAllowedOriginPatterns());
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }

  private String[] getPublicEndpoints() {
    List<String> endpoints =
        new ArrayList<>(List.of("/api/v1/auth/**", "/api/v1/health", "/uploads/**"));
    if (isDevProfile()) {
      endpoints.add("/h2-console/**");
    }
    return endpoints.toArray(String[]::new);
  }

  private boolean isDevProfile() {
    return environment.matchesProfiles("dev");
  }

  private List<String> getCorsAllowedOrigins() {
    return getStringListProperty("offmode.security.cors.allowed-origins");
  }

  private List<String> getCorsAllowedOriginPatterns() {
    if (!isDevProfile()) {
      return List.of();
    }
    return getStringListProperty("offmode.security.cors.allowed-origin-patterns");
  }

  private List<String> getStringListProperty(String key) {
    return Binder.get(environment)
        .bind(key, Bindable.listOf(String.class))
        .orElseGet(List::of)
        .stream()
        .map(String::trim)
        .filter(value -> !value.isBlank())
        .toList();
  }

  private void writeErrorResponse(HttpServletResponse response, ErrorStatus errorStatus)
      throws java.io.IOException {
    response.setStatus(errorStatus.getHttpStatus().value());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.setCharacterEncoding("UTF-8");
    objectMapper.writeValue(response.getWriter(), ApiResponse.onFailure(errorStatus).getBody());
  }
}
