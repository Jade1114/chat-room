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
    private String organizationId;
    private String title;
    private String description;
    private String location;
    private Instant startTime;
    private Instant endTime;
    private String visibility;
    private String createdBy;
    private Instant createdAt;
}
