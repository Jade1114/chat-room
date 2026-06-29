package com.yuy.chatroom.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ActivityHotMetrics {
  private double score;
  private long detailViews;
  private long participationMethodViews;
  private long interestCount;
}
