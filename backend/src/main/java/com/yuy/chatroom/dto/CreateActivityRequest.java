package com.yuy.chatroom.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CreateActivityRequest {
  private String title;
  private String description;
  private String category;
  private String tags;
  private String timeMode;
  private String startTime;
  private String endTime;
  private String expiresAt;
  private String location;
  private String participationMethod;
}
