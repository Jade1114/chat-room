package com.yuy.chatroom.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.yuy.chatroom.model.Channel;
import com.yuy.chatroom.model.ChannelDetail;
import com.yuy.chatroom.model.CurrentUser;
import com.yuy.chatroom.service.CampusDirectoryService;
import com.yuy.chatroom.service.ChannelPresenceService;

import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
public class CampusController {
    private final CampusDirectoryService campusDirectoryService;
    private final ChannelPresenceService channelPresenceService;

    @GetMapping("/api/me")
    public CurrentUser getCurrentUser(@RequestParam(required = false) String userId) {
        return campusDirectoryService.getCurrentUser(userId);
    }

    @GetMapping("/api/mock-users")
    public List<CurrentUser> getMockUsers() {
        return campusDirectoryService.getUsers();
    }

    @GetMapping("/api/channels")
    public List<Channel> getChannels(@RequestParam(required = false) String userId) {
        return campusDirectoryService.getAccessibleChannels(userId);
    }

    @GetMapping("/api/channels/{channelId}")
    public ResponseEntity<ChannelDetail> getChannelDetail(
            @PathVariable String channelId,
            @RequestParam(required = false) String userId) {
        return campusDirectoryService.getAccessibleChannelDetail(userId, channelId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Register current user as online in a channel.
     * Returns 403 if the user doesn't have access to the channel.
     *
     * <p>⚠️ TODO: WebSocket — this is a temporary REST endpoint for testing presence.
     * Replace with WebSocket connection event when the channel-based WebSocket handler is built.
     */
    @PostMapping("/api/channels/{channelId}/join")
    public ResponseEntity<Void> joinChannel(
            @PathVariable String channelId,
            @RequestParam(required = false) String userId) {
        if (!campusDirectoryService.canAccess(userId, channelId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        channelPresenceService.join(channelId, campusDirectoryService.getCurrentUser(userId).getId());
        return ResponseEntity.ok().build();
    }

    /**
     * Remove current user from a channel's online set.
     *
     * <p>⚠️ TODO: WebSocket — replace with WebSocket disconnection event.
     */
    @PostMapping("/api/channels/{channelId}/leave")
    public ResponseEntity<Void> leaveChannel(
            @PathVariable String channelId,
            @RequestParam(required = false) String userId) {
        channelPresenceService.leave(channelId, campusDirectoryService.getCurrentUser(userId).getId());
        return ResponseEntity.ok().build();
    }
}
