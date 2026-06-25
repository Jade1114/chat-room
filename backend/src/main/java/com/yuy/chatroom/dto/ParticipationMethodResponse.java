package com.yuy.chatroom.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ParticipationMethodResponse {
  private String activityId;
  private String participationMethod;
}
