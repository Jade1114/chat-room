package com.yuy.chatroom.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChannelDetail {
    private String id;
    private String name;
    private ChannelType type;
    private String scopeId;
    private String description;

    @JsonProperty("readonly")
    private boolean isReadonly;

    private int onlineCount;
    private List<String> onlineUsers;
}
