package com.yuy.chatroom.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.yuy.chatroom.dto.AdminUserDto;
import com.yuy.chatroom.dto.AssignChannelRequest;
import com.yuy.chatroom.mapper.ChannelMapper;
import com.yuy.chatroom.mapper.UserMapper;
import com.yuy.chatroom.model.Channel;
import com.yuy.chatroom.model.CurrentUser;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

  private final UserMapper userMapper;
  private final ChannelMapper channelMapper;

  public AdminController(UserMapper userMapper, ChannelMapper channelMapper) {
    this.userMapper = userMapper;
    this.channelMapper = channelMapper;
  }

  @GetMapping("/users")
  public ResponseEntity<?> listUsers(HttpServletRequest request) {
    if (!isAdmin(request)) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "仅管理员可访问"));
    }

    List<CurrentUser> users = userMapper.findAll();
    List<AdminUserDto> result = new ArrayList<>();

    for (CurrentUser user : users) {
      List<Map<String, Object>> rows = userMapper.findAssignedCoursesByUserId(user.getId());
      List<AdminUserDto.AssignedChannel> channels = new ArrayList<>();
      for (Map<String, Object> row : rows) {
        channels.add(new AdminUserDto.AssignedChannel(
            (String) row.get("channel_id"),
            (String) row.get("channel_name")));
      }
      result.add(new AdminUserDto(
          user.getId(),
          null,
          user.getDisplayName(),
          user.getRole().name(),
          user.getSchoolId(),
          user.getDepartmentId(),
          user.getClassId(),
          channels));
    }

    return ResponseEntity.ok(result);
  }

  @GetMapping("/courses")
  public ResponseEntity<?> listCourses(HttpServletRequest request) {
    if (!isAdmin(request)) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "仅管理员可访问"));
    }

    // Only COURSE type channels can be assigned via user_course
    List<Channel> courses = channelMapper.findAll().stream()
        .filter(ch -> ch.getType().name().equals("COURSE"))
        .toList();

    return ResponseEntity.ok(courses);
  }

  @PostMapping("/assign")
  public ResponseEntity<?> assignChannel(@RequestBody AssignChannelRequest req,
      HttpServletRequest request) {
    if (!isAdmin(request)) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "仅管理员可访问"));
    }

    if (isBlank(req.getUserId()) || isBlank(req.getChannelId())) {
      return ResponseEntity.badRequest().body(Map.of("error", "userId 和 channelId 不能为空"));
    }

    // Verify channel exists and is a course
    Channel channel = channelMapper.findById(req.getChannelId());
    if (channel == null || !channel.getType().name().equals("COURSE")) {
      return ResponseEntity.badRequest().body(Map.of("error", "频道不存在或不是课程频道"));
    }

    // Verify user exists
    if (userMapper.findById(req.getUserId()) == null) {
      return ResponseEntity.badRequest().body(Map.of("error", "用户不存在"));
    }

    userMapper.insertUserCourse(req.getUserId(), channel.getScopeId());
    return ResponseEntity.ok(Map.of("ok", true));
  }

  @DeleteMapping("/assign")
  public ResponseEntity<?> unassignChannel(@RequestBody AssignChannelRequest req,
      HttpServletRequest request) {
    if (!isAdmin(request)) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "仅管理员可访问"));
    }

    if (isBlank(req.getUserId()) || isBlank(req.getChannelId())) {
      return ResponseEntity.badRequest().body(Map.of("error", "userId 和 channelId 不能为空"));
    }

    Channel channel = channelMapper.findById(req.getChannelId());
    if (channel == null) {
      return ResponseEntity.badRequest().body(Map.of("error", "频道不存在"));
    }

    userMapper.deleteUserCourse(req.getUserId(), channel.getScopeId());
    return ResponseEntity.ok(Map.of("ok", true));
  }

  private boolean isAdmin(HttpServletRequest request) {
    String role = (String) request.getAttribute("role");
    return "ADMIN".equals(role);
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
