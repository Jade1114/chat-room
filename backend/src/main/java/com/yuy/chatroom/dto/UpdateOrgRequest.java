package com.yuy.chatroom.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrgRequest {
  private String userId;
  private String schoolId;
  private String departmentId;
  private String classId;
}
