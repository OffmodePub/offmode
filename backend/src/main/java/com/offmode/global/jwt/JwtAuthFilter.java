package com.offmode.global.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

  private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);
  private final JwtProvider jwtProvider;

  @Override
  protected void doFilterInternal(
      HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    String header = req.getHeader("Authorization");
    if (header != null && header.startsWith("Bearer ")) {
      String token = header.substring(7);
      boolean valid = jwtProvider.isValid(token);
      logger.debug("JWT token received, valid={}, path={}", valid, req.getRequestURI());
      if (valid) {
        Long userId = jwtProvider.getUserId(token);
        var auth = new UsernamePasswordAuthenticationToken(userId, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
      }
    } else {
      logger.debug("No Bearer token on path={}", req.getRequestURI());
    }
    chain.doFilter(req, res);
  }
}
