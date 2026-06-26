package com.yuy.chatroom.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AdminOverviewResponse {
  private long siteVisitors;
  private long totalActivities;
  private long publishedActivities;
  private long closedActivities;
  private long expiredActivities;
  private long participationMethodViews;
  private double contactViewRate;
  private List<AdminActivityMetric> topActivities;
  private List<AdminEventMetric> recentEvents;
}
