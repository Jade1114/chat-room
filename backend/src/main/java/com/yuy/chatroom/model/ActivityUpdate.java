package com.yuy.chatroom.model;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ActivityUpdate {
  private String id;
  private String activityId;
  private String authorUserId;
  private String authorLocalSessionId;
  private String authorDisplayName;
  private String content;
  private Instant createdAt;
}
