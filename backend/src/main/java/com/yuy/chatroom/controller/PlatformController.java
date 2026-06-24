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
import com.yuy.chatroom.service.OrganizationDirectoryService;
import com.yuy.chatroom.service.MessageHistoryService;
import com.yuy.chatroom.service.UnreadMessageService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
public class PlatformController {
  private final OrganizationDirectoryService organizationDirectoryService;
  private final MessageHistoryService messageHistoryService;
  private final UnreadMessageService unreadMessageService;

  @GetMapping("/api/me")
  public CurrentUser getCurrentUser(HttpServletRequest request,
      @RequestParam(required = false) String userId) {
    String resolvedUserId = resolveUserId(request, userId);
    return organizationDirectoryService.getCurrentUser(resolvedUserId);
  }

  @GetMapping("/api/mock-users")
  public List<CurrentUser> getMockUsers() {
    return organizationDirectoryService.getUsers();
  }

  @GetMapping("/api/channels")
  public List<Channel> getChannels(HttpServletRequest request,
      @RequestParam(required = false) String userId) {
    String resolvedUserId = resolveUserId(request, userId);
    List<Channel> channels = organizationDirectoryService.getAccessibleChannels(resolvedUserId);
    CurrentUser user = organizationDirectoryService.getCurrentUser(resolvedUserId);
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
      HttpServletRequest request,
      @RequestParam(required = false) String userId) {
    String resolvedUserId = resolveUserId(request, userId);
    return organizationDirectoryService.getAccessibleChannelDetail(resolvedUserId, channelId)
        .map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @GetMapping("/api/channels/{channelId}/messages")
  public ResponseEntity<List<Message>> getChannelMessages(
      @PathVariable String channelId,
      HttpServletRequest request,
      @RequestParam(required = false) String userId,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant before,
      @RequestParam(required = false) Integer limit) {
    String resolvedUserId = resolveUserId(request, userId);
    if (!organizationDirectoryService.canAccess(resolvedUserId, channelId)) {
      return ResponseEntity.notFound().build();
    }

    if (before == null) {
      return ResponseEntity.ok(messageHistoryService.getRecentMessages(channelId, limit));
    }
    return ResponseEntity.ok(messageHistoryService.getMessagesBefore(channelId, before, limit));
  }

  private String resolveUserId(HttpServletRequest request, String queryUserId) {
    String authUserId = (String) request.getAttribute("userId");
    if (authUserId != null) {
      return authUserId;
    }
    // Fallback: old query-param style for migration period
    return queryUserId;
  }

}
