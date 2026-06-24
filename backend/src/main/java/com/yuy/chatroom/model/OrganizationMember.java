package com.yuy.chatroom.model;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationMember {
    private String organizationId;
    private String userId;
    private String role;
    private Instant joinedAt;
}
