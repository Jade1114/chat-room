package com.yuy.chatroom.controller;

import java.time.Instant;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.yuy.chatroom.model.Channel;
import com.yuy.chatroom.model.ChannelDetail;
import com.yuy.chatroom.model.CurrentUser;
import com.yuy.chatroom.model.Message;
import com.yuy.chatroom.service.CampusDirectoryService;
import com.yuy.chatroom.service.MessageHistoryService;
import com.yuy.chatroom.service.UnreadMessageService;

import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
public class CampusController {
  private final CampusDirectoryService campusDirectoryService;
  private final MessageHistoryService messageHistoryService;
  private final UnreadMessageService unreadMessageService;

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
    List<Channel> channels = campusDirectoryService.getAccessibleChannels(userId);
    CurrentUser user = campusDirectoryService.getCurrentUser(userId);
    if (user == null) {
      return channels;
    }

    for (Channel channel : channels) {
      channel.setUnreadCount(unreadMessageService.getUnreadCount(user.getId(), channel.getId()));
    }
    return channels;
  }

  @GetMapping("/api/channels/{channelId}")
  public ResponseEntity<ChannelDetail> getChannelDetail(
      @PathVariable String channelId,
      @RequestParam(required = false) String userId) {
    return campusDirectoryService.getAccessibleChannelDetail(userId, channelId)
        .map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @GetMapping("/api/channels/{channelId}/messages")
  public ResponseEntity<List<Message>> getChannelMessages(
      @PathVariable String channelId,
      @RequestParam(required = false) String userId,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant before,
      @RequestParam(required = false) Integer limit) {
    if (!campusDirectoryService.canAccess(userId, channelId)) {
      return ResponseEntity.notFound().build();
    }

    if (before == null) {
      return ResponseEntity.ok(messageHistoryService.getRecentMessages(channelId, limit));
    }
    return ResponseEntity.ok(messageHistoryService.getMessagesBefore(channelId, before, limit));
  }

}
