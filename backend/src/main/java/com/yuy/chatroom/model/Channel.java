package com.yuy.chatroom.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Channel {
    private String id;
    private String name;
    private ChannelType type;
    private String scopeId;
    private String description;
    private boolean readonly;
}
