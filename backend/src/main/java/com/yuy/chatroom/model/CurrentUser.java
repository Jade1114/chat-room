package com.yuy.chatroom.model;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CurrentUser {
    private String id;
    private String displayName;
    private UserRole role;
    private String schoolId;
    private String departmentId;
    private String classId;
    private List<String> courseIds;
}
