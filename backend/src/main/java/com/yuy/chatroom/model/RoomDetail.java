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
public class RoomDetail {
    private String roomId;
    private int onlineCount;
    private List<String> usernames;
}
