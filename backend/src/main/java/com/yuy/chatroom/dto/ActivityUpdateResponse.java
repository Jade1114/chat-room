package com.yuy.chatroom.dto;

import java.time.Instant;

import com.yuy.chatroom.model.ActivityUpdate;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ActivityUpdateResponse {
  private String id;
  private String activityId;
  private String content;
  private String authorDisplayName;
  private Instant createdAt;

  public static ActivityUpdateResponse from(ActivityUpdate update) {
    return new ActivityUpdateResponse(
        update.getId(),
        update.getActivityId(),
        update.getContent(),
        update.getAuthorDisplayName(),
        update.getCreatedAt());
  }
}
