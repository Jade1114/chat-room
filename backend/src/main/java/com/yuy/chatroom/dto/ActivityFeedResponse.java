package com.yuy.chatroom.dto;

import java.util.List;

import lombok.Getter;

@Getter
public class ActivityFeedResponse {
  private List<ActivityResponse> upcoming;
  private List<ActivityResponse> ongoing;
  private List<ActivityResponse> hot;

  public ActivityFeedResponse(List<ActivityResponse> upcoming, List<ActivityResponse> ongoing) {
    this(upcoming, ongoing, List.of());
  }

  public ActivityFeedResponse(List<ActivityResponse> upcoming, List<ActivityResponse> ongoing,
      List<ActivityResponse> hot) {
    this.upcoming = upcoming;
    this.ongoing = ongoing;
    this.hot = hot;
  }
}
