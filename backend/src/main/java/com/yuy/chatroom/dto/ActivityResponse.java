package com.yuy.chatroom.dto;

import java.time.Instant;

import com.yuy.chatroom.model.Activity;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ActivityResponse {
  private String id;
  private String title;
  private String description;
  private String category;
  private String tags;
  private String timeMode;
  private Instant startTime;
  private Instant endTime;
  private Instant expiresAt;
  private String location;
  private String participationMethod;
  private String status;
  private String createdBy;
  private String createdByUserId;
  private String createdByLocalSessionId;
  private String initiatorDisplayName;
  private long interestCount;
  private boolean interestedByCurrentIdentity;
  private boolean canExpressInterest;
  private boolean initiatedByCurrentIdentity;
  private ActivityHotMetrics hotMetrics;
  private Instant createdAt;
  private Instant updatedAt;

  public static ActivityResponse from(Activity activity, boolean includeParticipationMethod) {
    return from(activity, includeParticipationMethod, 0, false, false);
  }

  public static ActivityResponse from(Activity activity, boolean includeParticipationMethod,
      long interestCount, boolean interestedByCurrentIdentity, boolean initiatedByCurrentIdentity) {
    return from(activity, includeParticipationMethod, interestCount, interestedByCurrentIdentity,
        initiatedByCurrentIdentity, null);
  }

  public static ActivityResponse from(Activity activity, boolean includeParticipationMethod,
      long interestCount, boolean interestedByCurrentIdentity, boolean initiatedByCurrentIdentity,
      ActivityHotMetrics hotMetrics) {
    return new ActivityResponse(
        activity.getId(),
        activity.getTitle(),
        activity.getDescription(),
        activity.getCategory(),
        activity.getTags(),
        activity.getTimeMode(),
        activity.getStartTime(),
        activity.getEndTime(),
        activity.getExpiresAt(),
        activity.getLocation(),
        includeParticipationMethod ? activity.getParticipationMethod() : null,
        activity.getStatus(),
        activity.getCreatedBy(),
        activity.getCreatedByUserId(),
        activity.getCreatedByLocalSessionId(),
        activity.getInitiatorDisplayName(),
        interestCount,
        interestedByCurrentIdentity,
        !initiatedByCurrentIdentity && !interestedByCurrentIdentity,
        initiatedByCurrentIdentity,
        hotMetrics,
        activity.getCreatedAt(),
        activity.getUpdatedAt());
  }
}
