package com.yuy.chatroom.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationSummaryResponse {
  private String id;
  private String name;
  private String description;
  private String visibility;
  private String joinPolicy;
  private long memberCount;
  private boolean joined;
  private String defaultChannelId;
}
