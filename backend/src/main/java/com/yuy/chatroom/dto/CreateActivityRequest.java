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
  private String location;
  private String startTime;
  private String endTime;
}
