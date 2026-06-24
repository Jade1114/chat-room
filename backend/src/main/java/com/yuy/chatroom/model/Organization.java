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
public class Organization {
    private String id;
    private String name;
    private String description;
    private String visibility;
    private String joinPolicy;
    private String createdBy;
    private Instant createdAt;
}
