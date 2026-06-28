package com.yuy.chatroom.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.yuy.chatroom.dto.CreateActivityRequest;
import com.yuy.chatroom.dto.ParticipationMethodResponse;
import com.yuy.chatroom.service.ActivityService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
public class ActivityController {

  private final ActivityService activityService;

  @GetMapping("/api/activities")
  public ResponseEntity<?> getFeed(@RequestParam(required = false) String query,
      @RequestParam(required = false) String category,
      @RequestParam(required = false) String tag) {
    return ResponseEntity.ok(activityService.getFeed(query, category, tag));
  }

  @GetMapping("/api/activities/{activityId}")
  public ResponseEntity<?> getDetail(@PathVariable String activityId, HttpServletRequest request) {
    try {
      return ResponseEntity.ok(activityService.getDetail(activityId, currentUserId(request), localSessionId(request)));
    } catch (IllegalArgumentException error) {
      return notFoundOrBadRequest(error);
    }
  }

  @PostMapping("/api/activities/{activityId}/participation-method")
  public ResponseEntity<?> revealParticipationMethod(@PathVariable String activityId, HttpServletRequest request) {
    try {
      String method = activityService.revealParticipationMethod(activityId, currentUserId(request), localSessionId(request));
      return ResponseEntity.ok(new ParticipationMethodResponse(activityId, method));
    } catch (IllegalArgumentException error) {
      return notFoundOrBadRequest(error);
    }
  }

  @PostMapping("/api/activities/{activityId}/interest")
  public ResponseEntity<?> expressInterest(@PathVariable String activityId, HttpServletRequest request) {
    try {
      return ResponseEntity.ok(activityService.expressInterest(activityId, currentUserId(request), localSessionId(request)));
    } catch (SecurityException error) {
      return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", error.getMessage()));
    } catch (IllegalArgumentException error) {
      return notFoundOrBadRequest(error);
    }
  }

  @PostMapping("/api/site-events/visit")
  public ResponseEntity<?> recordSiteVisit(HttpServletRequest request) {
    activityService.recordSiteVisit(currentUserId(request), localSessionId(request));
    return ResponseEntity.ok(Map.of("ok", true));
  }

  @PostMapping("/api/activities")
  public ResponseEntity<?> createActivity(@RequestBody CreateActivityRequest createRequest, HttpServletRequest request) {
    try {
      return ResponseEntity.ok(activityService.createActivity(createRequest, currentUserId(request), localSessionId(request)));
    } catch (IllegalArgumentException error) {
      return ResponseEntity.badRequest().body(Map.of("error", error.getMessage()));
    }
  }

  @PutMapping("/api/activities/{activityId}")
  public ResponseEntity<?> updateActivity(@PathVariable String activityId,
      @RequestBody CreateActivityRequest updateRequest,
      HttpServletRequest request) {
    try {
      return ResponseEntity.ok(activityService.updateActivity(activityId, updateRequest, currentUserId(request), localSessionId(request)));
    } catch (SecurityException error) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", error.getMessage()));
    } catch (IllegalArgumentException error) {
      return notFoundOrBadRequest(error);
    }
  }

  @PostMapping("/api/activities/{activityId}/close")
  public ResponseEntity<?> closeActivity(@PathVariable String activityId, HttpServletRequest request) {
    try {
      return ResponseEntity.ok(activityService.closeActivity(activityId, currentUserId(request), localSessionId(request)));
    } catch (SecurityException error) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", error.getMessage()));
    } catch (IllegalArgumentException error) {
      return notFoundOrBadRequest(error);
    }
  }

  @GetMapping("/api/me/activities")
  public ResponseEntity<?> getMyInitiated(HttpServletRequest request) {
    try {
      return ResponseEntity.ok(activityService.getMyInitiated(currentUserId(request), localSessionId(request)));
    } catch (IllegalArgumentException error) {
      return notFoundOrBadRequest(error);
    }
  }

  private String currentUserId(HttpServletRequest request) {
    return (String) request.getAttribute("userId");
  }

  private String localSessionId(HttpServletRequest request) {
    return request.getHeader("X-Local-Session-Id");
  }

  private ResponseEntity<?> notFoundOrBadRequest(IllegalArgumentException error) {
    if ("Activity 不存在".equals(error.getMessage())) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", error.getMessage()));
    }
    if ("未登录".equals(error.getMessage())) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", error.getMessage()));
    }
    return ResponseEntity.badRequest().body(Map.of("error", error.getMessage()));
  }
}
