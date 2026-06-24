package com.yuy.chatroom.dto;

import java.util.List;

import com.yuy.chatroom.model.Channel;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class OrganizationDetailResponse extends OrganizationSummaryResponse {
  private List<Channel> channels;

  public OrganizationDetailResponse(String id, String name, String description, String visibility,
      String joinPolicy, long memberCount, boolean joined, String defaultChannelId,
      List<Channel> channels) {
    super(id, name, description, visibility, joinPolicy, memberCount, joined, defaultChannelId);
    this.channels = channels;
  }
}
