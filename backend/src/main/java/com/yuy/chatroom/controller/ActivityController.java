package com.yuy.chatroom.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.yuy.chatroom.dto.CreateActivityRequest;
import com.yuy.chatroom.model.Activity;
import com.yuy.chatroom.service.ActivityService;

import jakarta.servlet.http.HttpServletRequest;

import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
public class ActivityController {

  private final ActivityService activityService;

  @GetMapping("/api/activities")
  public List<Activity> getUpcomingActivities() {
    return activityService.getUpcomingPublicActivities();
  }

  @PostMapping("/api/organizations/{organizationId}/activities")
  public ResponseEntity<?> createOrganizationActivity(
      @PathVariable String organizationId,
      @RequestBody CreateActivityRequest createRequest,
      HttpServletRequest request) {
    String userId = (String) request.getAttribute("userId");
    if (userId == null || userId.isBlank()) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "未登录"));
    }

    try {
      Activity activity = activityService.createActivity(organizationId, createRequest, userId);
      return ResponseEntity.ok(activity);
    } catch (SecurityException error) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", error.getMessage()));
    } catch (IllegalArgumentException error) {
      if ("组织不存在".equals(error.getMessage())) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", error.getMessage()));
      }
      return ResponseEntity.badRequest().body(Map.of("error", error.getMessage()));
    }
  }
}
