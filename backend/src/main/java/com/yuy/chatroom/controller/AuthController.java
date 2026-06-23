package com.yuy.chatroom.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.yuy.chatroom.dto.AuthResponse;
import com.yuy.chatroom.dto.DevLoginRequest;
import com.yuy.chatroom.dto.LoginRequest;
import com.yuy.chatroom.dto.RegisterRequest;
import com.yuy.chatroom.mapper.UserMapper;
import com.yuy.chatroom.model.CurrentUser;
import com.yuy.chatroom.security.JwtTokenProvider;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final UserMapper userMapper;
  private final JwtTokenProvider jwtTokenProvider;
  private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
  private final Logger log = LoggerFactory.getLogger(AuthController.class);
  private static final String DEFAULT_SCHOOL_ID = "school-1";

  public AuthController(UserMapper userMapper, JwtTokenProvider jwtTokenProvider) {
    this.userMapper = userMapper;
    this.jwtTokenProvider = jwtTokenProvider;
  }

  @PostMapping("/register")
  public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
    if (isBlank(request.getUsername()) || isBlank(request.getPassword()) || isBlank(request.getDisplayName())) {
      return ResponseEntity.badRequest().body(Map.of("error", "用户名、显示名和密码不能为空"));
    }

    if (userMapper.findByUsername(request.getUsername()) != null) {
      return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "用户名已存在"));
    }

    String userId = "u-" + UUID.randomUUID().toString().substring(0, 8);
    String hash = passwordEncoder.encode(request.getPassword());

    // 当前阶段不启用多组织/多高校选择。新注册用户默认进入同一个公开组织。
    // 后续多组织邀请 / 自我管理模式上线后，再把这里改为邀请或组织选择链路。
    userMapper.insertUser(userId, request.getUsername(), request.getDisplayName(), hash, "STUDENT",
        DEFAULT_SCHOOL_ID, null, null);

    String token = jwtTokenProvider.createToken(userId, "STUDENT", request.getDisplayName());

    AuthResponse response = new AuthResponse(token, userId, request.getDisplayName(), "STUDENT");
    return ResponseEntity.ok(response);
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    if (isBlank(request.getUsername()) || isBlank(request.getPassword())) {
      return ResponseEntity.badRequest().body(Map.of("error", "用户名和密码不能为空"));
    }

    Map<String, Object> row = userMapper.findAuthByUsername(request.getUsername());
    if (row == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "用户名或密码错误"));
    }

    String passwordHash = (String) row.get("password_hash");
    if (passwordHash == null || !passwordEncoder.matches(request.getPassword(), passwordHash)) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "用户名或密码错误"));
    }

    String userId = (String) row.get("id");
    String role = (String) row.get("role");
    String displayName = (String) row.get("display_name");

    String token = jwtTokenProvider.createToken(userId, role, displayName);

    AuthResponse response = new AuthResponse(token, userId, displayName, role);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/me")
  public ResponseEntity<?> me(HttpServletRequest request) {
    // /api/auth/me is explicitly skipped by JwtAuthFilter to avoid recursion,
    // so we must manually validate the token from the Authorization header.
    String userId = resolveUserIdFromRequest(request);

    if (userId == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "未登录"));
    }

    CurrentUser user = userMapper.findById(userId);
    if (user == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "用户不存在"));
    }
    user.setCourseIds(userMapper.findCourseIdsByUserId(user.getId()));
    return ResponseEntity.ok(user);
  }

  private String resolveUserIdFromRequest(HttpServletRequest request) {
    // 1. Try request attribute (set by JwtAuthFilter for non-auth paths)
    String userId = (String) request.getAttribute("userId");
    if (userId != null) {
      return userId;
    }

    // 2. Try Authorization header (manual parse, needed because filter skips /api/auth/*)
    String header = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (header != null && header.startsWith("Bearer ")) {
      String token = header.substring(7);
      return jwtTokenProvider.getUserId(token);
    }

    // 3. Fallback: old query-param style
    return request.getParameter("userId");
  }

  @PostMapping("/dev-login")
  public ResponseEntity<?> devLogin(@RequestBody DevLoginRequest request) {
    if (isBlank(request.getUserId())) {
      return ResponseEntity.badRequest().body(Map.of("error", "userId 不能为空"));
    }

    CurrentUser user = userMapper.findById(request.getUserId());
    if (user == null) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "用户不存在"));
    }

    String token = jwtTokenProvider.createToken(user.getId(), user.getRole().name(), user.getDisplayName());

    AuthResponse response = new AuthResponse(token, user.getId(), user.getDisplayName(), user.getRole().name());
    return ResponseEntity.ok(response);
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
