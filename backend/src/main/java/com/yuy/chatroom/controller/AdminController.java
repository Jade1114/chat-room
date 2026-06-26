package com.yuy.chatroom.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.yuy.chatroom.dto.AdminOverviewResponse;
import com.yuy.chatroom.dto.AssignChannelRequest;
import com.yuy.chatroom.mapper.ActivityMapper;
import com.yuy.chatroom.mapper.UserMapper;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

  private final UserMapper userMapper;
  private final ActivityMapper activityMapper;

  public AdminController(UserMapper userMapper, ActivityMapper activityMapper) {
    this.userMapper = userMapper;
    this.activityMapper = activityMapper;
  }

  @GetMapping("/overview")
  public ResponseEntity<?> overview(HttpServletRequest request) {
    if (!isAdmin(request)) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "仅管理员可访问"));
    }

    long siteVisitors = activityMapper.countSiteVisitors();
    long participationMethodViews = activityMapper.countEventsByType("PARTICIPATION_METHOD_VIEW");
    double contactViewRate = siteVisitors == 0 ? 0 : (double) participationMethodViews / siteVisitors;

    AdminOverviewResponse response = new AdminOverviewResponse(
        siteVisitors,
        activityMapper.countActivities(),
        activityMapper.countActivitiesByStatus("PUBLISHED"),
        activityMapper.countActivitiesByStatus("CLOSED"),
        activityMapper.countActivitiesByStatus("EXPIRED"),
        participationMethodViews,
        contactViewRate,
        activityMapper.findTopActivityMetrics(8),
        activityMapper.findRecentEventMetrics(12));

    return ResponseEntity.ok(response);
  }

  @GetMapping("/users")
  public ResponseEntity<?> listUsers(HttpServletRequest request) {
    if (!isAdmin(request)) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "仅管理员可访问"));
    }
    return ResponseEntity.ok(userMapper.findAll());
  }

  @GetMapping("/legacy-channel-assignments")
  public ResponseEntity<?> rejectLegacyChannelAssignments(HttpServletRequest request) {
    if (!isAdmin(request)) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "仅管理员可访问"));
    }
    return ResponseEntity.badRequest().body(Map.of("error", "直接频道分配已收束，请使用组织成员关系"));
  }

  @PostMapping("/assign")
  public ResponseEntity<?> assignChannel(@RequestBody AssignChannelRequest req,
      HttpServletRequest request) {
    if (!isAdmin(request)) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "仅管理员可访问"));
    }
    return ResponseEntity.badRequest().body(Map.of("error", "组织成员关系请通过 OrganizationMember 管理"));
  }

  @DeleteMapping("/assign")
  public ResponseEntity<?> unassignChannel(@RequestBody AssignChannelRequest req,
      HttpServletRequest request) {
    if (!isAdmin(request)) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "仅管理员可访问"));
    }
    return ResponseEntity.badRequest().body(Map.of("error", "组织成员关系请通过 OrganizationMember 管理"));
  }

  private boolean isAdmin(HttpServletRequest request) {
    String role = (String) request.getAttribute("role");
    return "ADMIN".equals(role);
  }
}
