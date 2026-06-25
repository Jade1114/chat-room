package com.yuy.chatroom.service;

import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.yuy.chatroom.dto.ActivityFeedResponse;
import com.yuy.chatroom.dto.ActivityResponse;
import com.yuy.chatroom.dto.CreateActivityRequest;
import com.yuy.chatroom.mapper.ActivityMapper;
import com.yuy.chatroom.model.Activity;

@Service
public class ActivityService {

  private static final List<String> CATEGORIES = List.of(
      "STUDY", "SPORTS", "GAME", "PROJECT", "WORKSHOP", "COMPETITION", "TRAVEL", "TEAM_UP", "OTHER");

  private final ActivityMapper activityMapper;

  public ActivityService(ActivityMapper activityMapper) {
    this.activityMapper = activityMapper;
  }

  public ActivityFeedResponse getFeed(String query, String category, String tag) {
    Instant now = Instant.now();
    activityMapper.expireOutdated(now);
    List<ActivityResponse> activities = activityMapper.findFeed(now, cleanOptional(query), cleanOptional(category), cleanOptional(tag))
        .stream()
        .map(activity -> ActivityResponse.from(activity, false))
        .toList();
    return new ActivityFeedResponse(
        activities.stream().filter(a -> "SCHEDULED".equals(a.getTimeMode())).toList(),
        activities.stream().filter(a -> "ONGOING".equals(a.getTimeMode())).toList());
  }

  public ActivityResponse getDetail(String activityId, String userId) {
    Activity activity = requireActivity(activityId);
    recordEvent(activityId, userId, "DETAIL_VIEW");
    return ActivityResponse.from(activity, false);
  }

  public String revealParticipationMethod(String activityId, String userId) {
    Activity activity = requireActivity(activityId);
    recordEvent(activityId, userId, "PARTICIPATION_METHOD_VIEW");
    return activity.getParticipationMethod();
  }

  public ActivityResponse createActivity(CreateActivityRequest request, String userId) {
    Activity activity = buildActivity(new Activity(), request, userId, true);
    activityMapper.insert(activity);
    return ActivityResponse.from(activityMapper.findById(activity.getId()), false);
  }

  public ActivityResponse updateActivity(String activityId, CreateActivityRequest request, String userId) {
    Activity existing = requireActivity(activityId);
    requireOwner(existing, userId);
    if (!"DRAFT".equals(existing.getStatus()) && !"PUBLISHED".equals(existing.getStatus())) {
      throw new IllegalArgumentException("只能编辑草稿或已发布 Activity");
    }
    Activity updated = buildActivity(existing, request, userId, false);
    activityMapper.update(updated);
    return ActivityResponse.from(activityMapper.findById(activityId), false);
  }

  public ActivityResponse closeActivity(String activityId, String userId) {
    Activity activity = requireActivity(activityId);
    requireOwner(activity, userId);
    activity.setStatus("CLOSED");
    activity.setUpdatedAt(Instant.now());
    activityMapper.update(activity);
    return ActivityResponse.from(activityMapper.findById(activityId), false);
  }

  public List<ActivityResponse> getMyInitiated(String userId) {
    activityMapper.expireOutdated(Instant.now());
    return activityMapper.findByCreatedBy(userId).stream()
        .map(activity -> ActivityResponse.from(activity, false))
        .toList();
  }

  private Activity buildActivity(Activity activity, CreateActivityRequest request, String userId, boolean isNew) {
    String title = requiredText(request.getTitle(), "标题不能为空", 128, "标题不能超过 128 个字符");
    String description = requiredText(request.getDescription(), "说明不能为空", 2000, "说明不能超过 2000 个字符");
    String category = requiredText(request.getCategory(), "分类不能为空", 32, "分类不正确").toUpperCase();
    if (!CATEGORIES.contains(category)) {
      throw new IllegalArgumentException("分类不正确");
    }

    String timeMode = requiredText(request.getTimeMode(), "时间类型不能为空", 16, "时间类型不正确").toUpperCase();
    if (!"SCHEDULED".equals(timeMode) && !"ONGOING".equals(timeMode)) {
      throw new IllegalArgumentException("时间类型不正确");
    }

    String tags = normalizeTags(request.getTags());
    String location = requiredText(request.getLocation(), "地点不能为空", 128, "地点不能超过 128 个字符");
    String participationMethod = requiredText(request.getParticipationMethod(), "参与方式不能为空", 1000, "参与方式不能超过 1000 个字符");

    Instant startTime = null;
    Instant endTime = null;
    Instant expiresAt;
    Instant now = Instant.now();
    if ("SCHEDULED".equals(timeMode)) {
      startTime = parseInstant(request.getStartTime(), "开始时间不能为空");
      endTime = cleanOptional(request.getEndTime()) == null ? null : parseInstant(request.getEndTime(), "结束时间格式不正确");
      if (endTime != null && !endTime.isAfter(startTime)) {
        throw new IllegalArgumentException("结束时间必须晚于开始时间");
      }
      expiresAt = endTime == null ? startTime : endTime;
    } else {
      expiresAt = parseInstant(request.getExpiresAt(), "持续招募截止时间不能为空");
      if (expiresAt.isAfter(now.plus(Duration.ofDays(30)))) {
        throw new IllegalArgumentException("持续招募有效期最长 30 天");
      }
    }

    if (isNew) {
      activity.setId("act-" + UUID.randomUUID().toString().substring(0, 8));
      activity.setCreatedBy(userId);
      activity.setCreatedAt(now);
      activity.setStatus("PUBLISHED");
    }
    activity.setTitle(title);
    activity.setDescription(description);
    activity.setCategory(category);
    activity.setTags(tags);
    activity.setTimeMode(timeMode);
    activity.setStartTime(startTime);
    activity.setEndTime(endTime);
    activity.setExpiresAt(expiresAt);
    activity.setLocation(location);
    activity.setParticipationMethod(participationMethod);
    activity.setUpdatedAt(now);
    return activity;
  }

  private Activity requireActivity(String activityId) {
    Activity activity = activityMapper.findById(activityId);
    if (activity == null) {
      throw new IllegalArgumentException("Activity 不存在");
    }
    return activity;
  }

  private void requireOwner(Activity activity, String userId) {
    if (!activity.getCreatedBy().equals(userId)) {
      throw new SecurityException("只能管理自己发起的 Activity");
    }
  }

  private void recordEvent(String activityId, String userId, String eventType) {
    if (userId == null || userId.isBlank()) return;
    activityMapper.insertEvent("evt-" + UUID.randomUUID().toString().substring(0, 12), activityId, userId, eventType, Instant.now());
  }

  private String requiredText(String value, String blankMessage, int maxLength, String tooLongMessage) {
    String cleaned = value == null ? "" : value.trim();
    if (cleaned.isEmpty()) {
      throw new IllegalArgumentException(blankMessage);
    }
    if (cleaned.length() > maxLength) {
      throw new IllegalArgumentException(tooLongMessage);
    }
    return cleaned;
  }

  private String normalizeTags(String value) {
    String cleaned = value == null ? "" : value.trim();
    if (cleaned.isEmpty()) return "";
    List<String> tags = java.util.Arrays.stream(cleaned.split("[,，\\s]+"))
        .map(String::trim)
        .filter(tag -> !tag.isBlank())
        .distinct()
        .limit(5)
        .toList();
    return String.join(",", tags);
  }

  private String cleanOptional(String value) {
    if (value == null || value.isBlank()) return null;
    return value.trim();
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
