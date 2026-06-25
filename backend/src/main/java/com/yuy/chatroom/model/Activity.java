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
public class Activity {
    private String id;
    private String title;
    private String description;
    private String category;
    private String tags;
    private String timeMode;
    private Instant startTime;
    private Instant endTime;
    private Instant expiresAt;
    private String location;
    private String participationMethod;
    private String status;
    private String createdBy;
    private String initiatorDisplayName;
    private Instant createdAt;
    private Instant updatedAt;
}
