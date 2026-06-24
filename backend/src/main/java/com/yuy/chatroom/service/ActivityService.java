package com.yuy.chatroom.service;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.yuy.chatroom.dto.CreateActivityRequest;
import com.yuy.chatroom.mapper.ActivityMapper;
import com.yuy.chatroom.mapper.OrganizationMapper;
import com.yuy.chatroom.mapper.OrganizationMemberMapper;
import com.yuy.chatroom.model.Activity;

@Service
public class ActivityService {

  private final ActivityMapper activityMapper;
  private final OrganizationMapper organizationMapper;
  private final OrganizationMemberMapper organizationMemberMapper;

  public ActivityService(ActivityMapper activityMapper, OrganizationMapper organizationMapper,
      OrganizationMemberMapper organizationMemberMapper) {
    this.activityMapper = activityMapper;
    this.organizationMapper = organizationMapper;
    this.organizationMemberMapper = organizationMemberMapper;
  }

  public List<Activity> getOrganizationActivities(String organizationId) {
    return activityMapper.findPublicByOrganizationId(organizationId);
  }

  public List<Activity> getUpcomingPublicActivities() {
    return activityMapper.findUpcomingPublic(Instant.now(), 50);
  }

  public Activity createActivity(String organizationId, CreateActivityRequest request, String userId) {
    if (organizationMapper.findById(organizationId) == null) {
      throw new IllegalArgumentException("组织不存在");
    }

    String role = organizationMemberMapper.findRole(userId, organizationId);
    if (!"ORGANIZER".equals(role)) {
      throw new SecurityException("只有组织 Organizer 可以发布活动");
    }

    String title = request.getTitle() == null ? "" : request.getTitle().trim();
    if (title.isEmpty()) {
      throw new IllegalArgumentException("活动标题不能为空");
    }
    if (title.length() > 128) {
      throw new IllegalArgumentException("活动标题不能超过 128 个字符");
    }

    String description = request.getDescription() == null ? "" : request.getDescription().trim();
    if (description.length() > 512) {
      throw new IllegalArgumentException("活动描述不能超过 512 个字符");
    }

    String location = request.getLocation() == null ? "线上" : request.getLocation().trim();
    if (location.isEmpty()) {
      location = "线上";
    }
    if (location.length() > 128) {
      throw new IllegalArgumentException("活动地点不能超过 128 个字符");
    }

    Instant startTime = parseInstant(request.getStartTime(), "活动开始时间不能为空");
    Instant endTime = request.getEndTime() == null || request.getEndTime().isBlank()
        ? null
        : parseInstant(request.getEndTime(), "活动结束时间格式不正确");
    if (endTime != null && !endTime.isAfter(startTime)) {
      throw new IllegalArgumentException("活动结束时间必须晚于开始时间");
    }

    return createActivity(organizationId, title, description, location, startTime, endTime, userId);
  }

  public Activity createActivity(String organizationId, String title, String description,
      String location, Instant startTime, Instant endTime, String userId) {
    String id = "act-" + UUID.randomUUID().toString().substring(0, 8);
    Activity activity = new Activity(id, organizationId, title, description, location,
        startTime, endTime, "PUBLIC", userId, Instant.now());
    activityMapper.insert(activity);
    return activity;
  }

  private Instant parseInstant(String value, String errorMessage) {
    if (value == null || value.isBlank()) {
      throw new IllegalArgumentException(errorMessage);
    }
    try {
      return Instant.parse(value);
    } catch (DateTimeParseException error) {
      throw new IllegalArgumentException(errorMessage);
    }
  }
}
