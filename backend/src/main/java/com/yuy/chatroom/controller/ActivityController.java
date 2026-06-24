package com.yuy.chatroom.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.yuy.chatroom.model.Activity;
import com.yuy.chatroom.service.ActivityService;

import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
public class ActivityController {

  private final ActivityService activityService;

  @GetMapping("/api/activities")
  public List<Activity> getUpcomingActivities() {
    return activityService.getUpcomingPublicActivities();
  }
}
