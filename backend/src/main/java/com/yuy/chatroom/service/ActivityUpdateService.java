package com.yuy.chatroom.service;

import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.yuy.chatroom.dto.ActivityUpdateResponse;
import com.yuy.chatroom.dto.CreateActivityUpdateRequest;
import com.yuy.chatroom.mapper.ActivityMapper;
import com.yuy.chatroom.mapper.ActivityUpdateMapper;
import com.yuy.chatroom.model.Activity;
import com.yuy.chatroom.model.ActivityUpdate;

@Service
public class ActivityUpdateService {
  private final ActivityMapper activityMapper;
  private final ActivityUpdateMapper updateMapper;
  private final ActivityUpdateEventPublisher eventPublisher;

  public ActivityUpdateService(ActivityMapper activityMapper, ActivityUpdateMapper updateMapper,
      ActivityUpdateEventPublisher eventPublisher) {
    this.activityMapper = activityMapper;
    this.updateMapper = updateMapper;
    this.eventPublisher = eventPublisher;
  }

  public ActivityUpdateResponse publishUpdate(String activityId, CreateActivityUpdateRequest request,
      String userId, String localSessionId) {
    Activity activity = activityMapper.findById(activityId);
    if (activity == null) {
      throw new IllegalArgumentException("Activity 不存在");
    }
    if (!isInitiator(activity, userId, localSessionId)) {
      throw new SecurityException("只能给自己发起的 Activity 发布补充说明");
    }
    if (!"PUBLISHED".equals(activity.getStatus())) {
      throw new IllegalArgumentException("只有发布中的 Activity 可以添加补充说明");
    }
    ActivityUpdate update = new ActivityUpdate();
    update.setId("upd-" + UUID.randomUUID().toString().substring(0, 12));
    update.setActivityId(activityId);
    update.setAuthorUserId(cleanOptional(userId));
    update.setAuthorLocalSessionId(cleanOptional(localSessionId));
    update.setContent(requiredContent(request == null ? null : request.getContent()));
    update.setCreatedAt(Instant.now());
    updateMapper.insert(update);
    ActivityUpdate saved = updateMapper.findById(update.getId());
    eventPublisher.publish(activity, saved);
    return ActivityUpdateResponse.from(saved);
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

  private String requiredContent(String value) {
    String cleaned = value == null ? "" : value.trim();
    if (cleaned.isEmpty()) {
      throw new IllegalArgumentException("补充说明不能为空");
    }
    if (cleaned.length() > 800) {
      throw new IllegalArgumentException("补充说明不能超过 800 个字符");
    }
    return cleaned;
  }

  private String cleanOptional(String value) {
    if (value == null || value.isBlank()) return null;
    return value.trim();
  }
}
