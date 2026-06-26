package com.yuy.chatroom.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminActivityMetric {
  private String activityId;
  private String title;
  private String category;
  private long detailViews;
  private long participationMethodViews;
}
