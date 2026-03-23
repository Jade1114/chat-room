package com.yuy.chatroom.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.yuy.chatroom.model.RoomDetail;
import com.yuy.chatroom.model.RoomSummary;
import com.yuy.chatroom.service.SessionManager;

import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
public class RoomController {
    private final SessionManager sessionManager;

    @GetMapping("/api/rooms")
    public List<RoomSummary> getRooms() {
        return sessionManager.getRoomSummaries();
    }

    @GetMapping("/api/rooms/{roomId}")
    public RoomDetail getRoomDetail(@PathVariable String roomId) {
        return sessionManager.getRoomDetail(roomId);
    }
}
