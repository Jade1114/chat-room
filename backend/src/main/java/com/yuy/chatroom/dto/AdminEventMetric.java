package com.yuy.chatroom.dto;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminEventMetric {
  private String activityId;
  private String title;
  private String eventType;
  private String userId;
  private String visitorId;
  private Instant createdAt;
}
