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
  private String initiatorDisplayName;
  private Instant createdAt;
  private Instant updatedAt;

  public static ActivityResponse from(Activity activity, boolean includeParticipationMethod) {
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
        activity.getInitiatorDisplayName(),
        activity.getCreatedAt(),
        activity.getUpdatedAt());
  }
}
