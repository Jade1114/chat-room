package com.yuy.chatroom.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.yuy.chatroom.model.Channel;
import com.yuy.chatroom.model.ChannelDetail;
import com.yuy.chatroom.model.CurrentUser;
import com.yuy.chatroom.service.CampusDirectoryService;

import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
public class CampusController {
  private final CampusDirectoryService campusDirectoryService;

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

}
