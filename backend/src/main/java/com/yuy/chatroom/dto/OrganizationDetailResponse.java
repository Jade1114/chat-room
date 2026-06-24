package com.yuy.chatroom.dto;

import java.util.List;

import com.yuy.chatroom.model.Activity;
import com.yuy.chatroom.model.Channel;
import com.yuy.chatroom.model.MemberPreview;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class OrganizationDetailResponse extends OrganizationSummaryResponse {
  private List<Channel> channels;
  private List<String> tags;
  private String creatorName;
  private List<MemberPreview> members;
  private List<Activity> activities;

  public OrganizationDetailResponse(String id, String name, String description, String visibility,
      String joinPolicy, long memberCount, boolean joined, String defaultChannelId,
      List<Channel> channels, List<String> tags, String creatorName, List<MemberPreview> members,
      List<Activity> activities) {
    super(id, name, description, visibility, joinPolicy, memberCount, joined, defaultChannelId);
    this.channels = channels;
    this.tags = tags;
    this.creatorName = creatorName;
    this.members = members;
    this.activities = activities;
  }
}
