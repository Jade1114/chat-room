package com.yuy.chatroom.service;

import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.yuy.chatroom.dto.ActivityFeedResponse;
import com.yuy.chatroom.dto.ActivityHotMetrics;
import com.yuy.chatroom.dto.ActivityResponse;
import com.yuy.chatroom.dto.CreateActivityRequest;
import com.yuy.chatroom.mapper.ActivityMapper;
import com.yuy.chatroom.mapper.UserMapper;
import com.yuy.chatroom.model.Activity;

@Service
public class ActivityService {

  private static final String PUBLIC_CREATOR_USER_ID = "u-public";

  private static final List<String> CATEGORIES = List.of(
      "STUDY", "SPORTS", "GAME", "PROJECT", "WORKSHOP", "COMPETITION", "TRAVEL", "TEAM_UP", "OTHER");

  private final ActivityMapper activityMapper;
  private final UserMapper userMapper;
  private final ActivityInterestEventPublisher interestEventPublisher;
  private final ActivityHotScoreService hotScoreService;
  private final ActivityExpirationService expirationService;

  public ActivityService(ActivityMapper activityMapper, UserMapper userMapper,
      ActivityInterestEventPublisher interestEventPublisher, ActivityHotScoreService hotScoreService,
      ActivityExpirationService expirationService) {
    this.activityMapper = activityMapper;
    this.userMapper = userMapper;
    this.interestEventPublisher = interestEventPublisher;
    this.hotScoreService = hotScoreService;
    this.expirationService = expirationService;
  }

  public ActivityFeedResponse getFeed(String query, String category, String tag, String sort) {
    Instant now = Instant.now();
    activityMapper.expireOutdated(now);
    List<Activity> visibleActivities = activityMapper.findFeed(now, cleanOptional(query), cleanOptional(category), cleanOptional(tag));
    List<ActivityResponse> activities = isHotSort(sort)
        ? hotRankedResponses(visibleActivities)
        : visibleActivities.stream()
            .map(activity -> ActivityResponse.from(activity, false, activityMapper.countInterests(activity.getId()), false, false))
            .toList();
    return new ActivityFeedResponse(
        activities.stream().filter(a -> "SCHEDULED".equals(a.getTimeMode())).toList(),
        activities.stream().filter(a -> "ONGOING".equals(a.getTimeMode())).toList(),
        isHotSort(sort) ? activities : List.of());
  }

  private List<ActivityResponse> hotRankedResponses(List<Activity> visibleActivities) {
    Map<String, Activity> byId = new LinkedHashMap<>();
    for (Activity activity : visibleActivities) {
      byId.put(activity.getId(), activity);
    }
    return hotScoreService.rankActivityIds(visibleActivities.stream().map(Activity::getId).toList()).stream()
        .map(byId::get)
        .filter(activity -> activity != null)
        .map(activity -> {
          long interestCount = activityMapper.countInterests(activity.getId());
          return ActivityResponse.from(activity, false, interestCount, false, false,
              hotMetrics(activity.getId(), interestCount));
        })
        .toList();
  }

  private ActivityHotMetrics hotMetrics(String activityId, long interestCount) {
    return new ActivityHotMetrics(
        hotScoreService.score(activityId),
        activityMapper.countActivityEvents(activityId, "DETAIL_VIEW"),
        activityMapper.countActivityEvents(activityId, "PARTICIPATION_METHOD_VIEW"),
        interestCount);
  }

  private boolean isHotSort(String sort) {
    return "hot".equalsIgnoreCase(cleanOptional(sort));
  }

  public ActivityResponse getDetail(String activityId, String userId, String localSessionId) {
    associateLocalSessionToUser(userId, localSessionId);
    Activity activity = requireActivity(activityId);
    recordEvent(activityId, userId, localSessionId, "DETAIL_VIEW");
    hotScoreService.incrementDetailView(activityId);
    return responseForIdentity(activity, false, userId, localSessionId);
  }

  public String revealParticipationMethod(String activityId, String userId, String localSessionId) {
    Activity activity = requireActivity(activityId);
    recordEvent(activityId, userId, localSessionId, "PARTICIPATION_METHOD_VIEW");
    hotScoreService.incrementParticipationMethodView(activityId);
    return activity.getParticipationMethod();
  }

  public void recordSiteVisit(String userId, String localSessionId) {
    String cleanedLocalSessionId = cleanOptional(localSessionId);
    if (cleanedLocalSessionId == null) return;
    activityMapper.insertSiteEvent("site-" + UUID.randomUUID().toString().substring(0, 12),
        cleanedLocalSessionId, cleanOptional(userId), "SITE_VISIT", "/activities", Instant.now());
  }

  public ActivityResponse createActivity(CreateActivityRequest request, String userId, String localSessionId) {
    associateLocalSessionToUser(userId, localSessionId);
    String cleanedUserId = cleanOptional(userId);
    String cleanedLocalSessionId = cleanOptional(localSessionId);
    if (cleanedUserId == null && cleanedLocalSessionId == null) {
      throw new IllegalArgumentException("缺少本地身份");
    }

    String legacyCreatorId = cleanedUserId == null ? publicCreatorUserId() : cleanedUserId;
    Activity activity = buildActivity(new Activity(), request, legacyCreatorId, true);
    activity.setCreatedByUserId(cleanedUserId);
    activity.setCreatedByLocalSessionId(cleanedLocalSessionId);
    activityMapper.insert(activity);
    Activity created = activityMapper.findById(activity.getId());
    expirationService.indexActivity(created);
    return responseForIdentity(created, false, cleanedUserId, cleanedLocalSessionId);
  }

  private String publicCreatorUserId() {
    if (userMapper.findById(PUBLIC_CREATOR_USER_ID) == null) {
      userMapper.insertUser(PUBLIC_CREATOR_USER_ID, null, "匿名发布者", null, "MEMBER");
    }
    return PUBLIC_CREATOR_USER_ID;
  }

  public ActivityResponse updateActivity(String activityId, CreateActivityRequest request, String userId, String localSessionId) {
    associateLocalSessionToUser(userId, localSessionId);
    Activity existing = requireActivity(activityId);
    requireOwner(existing, userId, localSessionId);
    if (!"DRAFT".equals(existing.getStatus()) && !"PUBLISHED".equals(existing.getStatus())) {
      throw new IllegalArgumentException("只能编辑草稿或已发布 Activity");
    }
    Activity updated = buildActivity(existing, request, existing.getCreatedBy(), false);
    activityMapper.update(updated);
    Activity saved = activityMapper.findById(activityId);
    expirationService.indexActivity(saved);
    return responseForIdentity(saved, false, userId, localSessionId);
  }

  public ActivityResponse closeActivity(String activityId, String userId, String localSessionId) {
    associateLocalSessionToUser(userId, localSessionId);
    Activity activity = requireActivity(activityId);
    requireOwner(activity, userId, localSessionId);
    activity.setStatus("CLOSED");
    activity.setUpdatedAt(Instant.now());
    activityMapper.update(activity);
    expirationService.removeActivity(activityId);
    return responseForIdentity(activityMapper.findById(activityId), false, userId, localSessionId);
  }

  public List<ActivityResponse> getMyInitiated(String userId, String localSessionId) {
    associateLocalSessionToUser(userId, localSessionId);
    activityMapper.expireOutdated(Instant.now());
    String cleanedUserId = cleanOptional(userId);
    String cleanedLocalSessionId = cleanOptional(localSessionId);
    List<Activity> activities;
    if (cleanedUserId != null) {
      activities = activityMapper.findByCreatedByUser(cleanedUserId);
    } else {
      if (cleanedLocalSessionId == null) {
        throw new IllegalArgumentException("缺少本地身份");
      }
      activities = activityMapper.findByCreatedByLocalSession(cleanedLocalSessionId);
    }
    return activities.stream()
        .map(activity -> responseForIdentity(activity, false, cleanedUserId, cleanedLocalSessionId))
        .toList();
  }

  public ActivityResponse expressInterest(String activityId, String userId, String localSessionId) {
    associateLocalSessionToUser(userId, localSessionId);
    Activity activity = requireActivity(activityId);
    String cleanedUserId = cleanOptional(userId);
    String cleanedLocalSessionId = cleanOptional(localSessionId);
    if (cleanedUserId == null && cleanedLocalSessionId == null) {
      throw new IllegalArgumentException("缺少本地身份");
    }
    if (isInitiator(activity, cleanedUserId, cleanedLocalSessionId)) {
      throw new SecurityException("不能对自己发起的活动表达兴趣");
    }

    boolean createdNewInterest = false;
    if (cleanedUserId != null) {
      boolean alreadyByUser = activityMapper.hasUserInterest(activityId, cleanedUserId) > 0;
      if (!alreadyByUser && cleanedLocalSessionId != null
          && activityMapper.hasLocalSessionInterest(activityId, cleanedLocalSessionId) > 0) {
        activityMapper.associateLocalSessionInterest(activityId, cleanedLocalSessionId, cleanedUserId, Instant.now());
      } else if (!alreadyByUser) {
        createdNewInterest = activityMapper.insertInterest("int-" + UUID.randomUUID().toString().substring(0, 12),
            activityId, cleanedUserId, cleanedLocalSessionId, Instant.now()) > 0;
      }
    } else {
      createdNewInterest = activityMapper.insertInterest("int-" + UUID.randomUUID().toString().substring(0, 12),
          activityId, null, cleanedLocalSessionId, Instant.now()) > 0;
    }

    Activity updatedActivity = activityMapper.findById(activityId);
    long interestCount = activityMapper.countInterests(activityId);
    if (createdNewInterest) {
      interestEventPublisher.publishCreated(updatedActivity, interestCount);
    }

    return responseForIdentity(updatedActivity, false, cleanedUserId, cleanedLocalSessionId);
  }

  private ActivityResponse responseForIdentity(Activity activity, boolean includeParticipationMethod,
      String userId, String localSessionId) {
    String cleanedUserId = cleanOptional(userId);
    String cleanedLocalSessionId = cleanOptional(localSessionId);
    boolean interested = false;
    if (cleanedUserId != null) {
      interested = activityMapper.hasUserInterest(activity.getId(), cleanedUserId) > 0;
    }
    if (!interested && cleanedLocalSessionId != null) {
      interested = activityMapper.hasLocalSessionInterest(activity.getId(), cleanedLocalSessionId) > 0;
    }
    boolean initiated = isInitiator(activity, cleanedUserId, cleanedLocalSessionId);
    return ActivityResponse.from(activity, includeParticipationMethod,
        activityMapper.countInterests(activity.getId()), interested, initiated);
  }

  private void associateLocalSessionToUser(String userId, String localSessionId) {
    String cleanedUserId = cleanOptional(userId);
    String cleanedLocalSessionId = cleanOptional(localSessionId);
    if (cleanedUserId == null || cleanedLocalSessionId == null) {
      return;
    }
    Instant now = Instant.now();
    activityMapper.associateLocalSessionActivities(cleanedLocalSessionId, cleanedUserId, now);
    activityMapper.deleteDuplicateLocalSessionInterests(cleanedLocalSessionId, cleanedUserId);
    activityMapper.associateLocalSessionInterests(cleanedLocalSessionId, cleanedUserId, now);
  }

  private Activity buildActivity(Activity activity, CreateActivityRequest request, String legacyUserId, boolean isNew) {
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
      activity.setCreatedBy(legacyUserId);
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

  private void requireOwner(Activity activity, String userId, String localSessionId) {
    if (!isInitiator(activity, userId, localSessionId)) {
      throw new SecurityException("只能管理自己发起的 Activity");
    }
  }

  private boolean isInitiator(Activity activity, String userId, String localSessionId) {
    String cleanedUserId = cleanOptional(userId);
    String cleanedLocalSessionId = cleanOptional(localSessionId);
    if (cleanedUserId != null && cleanedUserId.equals(activity.getCreatedByUserId())) {
      return true;
    }
    return cleanedLocalSessionId != null
        && activity.getCreatedByLocalSessionId() != null
        && cleanedLocalSessionId.equals(activity.getCreatedByLocalSessionId());
  }

  private void recordEvent(String activityId, String userId, String localSessionId, String eventType) {
    String cleanedLocalSessionId = cleanOptional(localSessionId);
    String cleanedUserId = cleanOptional(userId);
    if (cleanedUserId == null && cleanedLocalSessionId == null) return;
    activityMapper.insertEvent("evt-" + UUID.randomUUID().toString().substring(0, 12),
        activityId, cleanedUserId, cleanedLocalSessionId, eventType, Instant.now());
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
