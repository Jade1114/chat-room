package com.yuy.chatroom.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDto {
  private String id;
  private String username;
  private String displayName;
  private String role;
  private String schoolId;
  private String departmentId;
  private String classId;
  private List<AssignedChannel> assignedChannels;

  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  public static class AssignedChannel {
    private String channelId;
    private String channelName;
  }
}
