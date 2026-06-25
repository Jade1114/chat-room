package com.yuy.chatroom.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ActivityFeedResponse {
  private List<ActivityResponse> upcoming;
  private List<ActivityResponse> ongoing;
}
