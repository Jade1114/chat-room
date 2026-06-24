package com.yuy.chatroom.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.yuy.chatroom.mapper.ActivityMapper;
import com.yuy.chatroom.model.Activity;

@Service
public class ActivityService {

  private final ActivityMapper activityMapper;

  public ActivityService(ActivityMapper activityMapper) {
    this.activityMapper = activityMapper;
  }

  public List<Activity> getOrganizationActivities(String organizationId) {
    return activityMapper.findPublicByOrganizationId(organizationId);
  }

  public List<Activity> getUpcomingPublicActivities() {
    return activityMapper.findUpcomingPublic(Instant.now(), 50);
  }

  public Activity createActivity(String organizationId, String title, String description,
      String location, Instant startTime, Instant endTime, String userId) {
    String id = "act-" + UUID.randomUUID().toString().substring(0, 8);
    Activity activity = new Activity(id, organizationId, title, description, location,
        startTime, endTime, "PUBLIC", userId, Instant.now());
    activityMapper.insert(activity);
    return activity;
  }
}
