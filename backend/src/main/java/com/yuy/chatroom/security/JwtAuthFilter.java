package com.yuy.chatroom.security;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.yuy.chatroom.mapper.UserMapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

  private final JwtTokenProvider jwtTokenProvider;
  private final UserMapper userMapper;
  private final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

  public JwtAuthFilter(JwtTokenProvider jwtTokenProvider, UserMapper userMapper) {
    this.jwtTokenProvider = jwtTokenProvider;
    this.userMapper = userMapper;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {
    String path = request.getRequestURI();

    // Skip WebSocket upgrade paths (authenticated via HandshakeAuthInterceptor)
    if (path.startsWith("/ws/")) {
      filterChain.doFilter(request, response);
      return;
    }

    // Skip auth endpoints
    if (path.startsWith("/api/auth/")) {
      filterChain.doFilter(request, response);
      return;
    }

    // Skip public endpoints
    if (path.startsWith("/api/mock-users") || path.equals("/api/me")
        || ("GET".equals(request.getMethod()) && path.equals("/api/activities"))
        || ("POST".equals(request.getMethod()) && path.equals("/api/activities"))
        || ("POST".equals(request.getMethod()) && path.equals("/api/site-events/visit"))
        || ("GET".equals(request.getMethod()) && path.equals("/api/me/activities"))
        || ("GET".equals(request.getMethod()) && path.matches("^/api/activities/[^/]+$"))
        || ("POST".equals(request.getMethod()) && path.matches("^/api/activities/[^/]+/close$"))
        || ("POST".equals(request.getMethod()) && path.matches("^/api/activities/[^/]+/participation-method$"))
        || ("POST".equals(request.getMethod()) && path.matches("^/api/activities/[^/]+/interest$"))
        || ("POST".equals(request.getMethod()) && path.matches("^/api/activities/[^/]+/updates$"))) {
      // /api/me and /api/mock-users are transitional — still accept query param userId
      filterChain.doFilter(request, response);
      return;
    }

    String header = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (header == null || !header.startsWith("Bearer ")) {
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      return;
    }

    String token = header.substring(7);
    String userId = jwtTokenProvider.getUserId(token);
    if (userId == null) {
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      return;
    }

    if (userMapper.findById(userId) == null) {
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      return;
    }

    String role = jwtTokenProvider.getRole(token);
    request.setAttribute("userId", userId);
    request.setAttribute("role", role);

    filterChain.doFilter(request, response);
  }
}
