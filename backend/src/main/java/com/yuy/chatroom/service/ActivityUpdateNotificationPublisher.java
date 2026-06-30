package com.yuy.chatroom.service;

import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class ActivityUpdateNotificationPublisher {
  private final NotificationSessionManager notificationSessionManager;
  private final ObjectMapper objectMapper;
  private final Logger log = LoggerFactory.getLogger(ActivityUpdateNotificationPublisher.class);

  public ActivityUpdateNotificationPublisher(NotificationSessionManager notificationSessionManager, ObjectMapper objectMapper) {
    this.notificationSessionManager = notificationSessionManager;
    this.objectMapper = objectMapper;
  }

  public void publishToInterestedIdentities(String activityId, String activityTitle, String updateId,
      Set<String> userIds, Set<String> localSessionIds) {
    if (activityId == null || activityId.isBlank() || updateId == null || updateId.isBlank()) {
      return;
    }
    Map<String, Object> payload = Map.of(
        "type", "ACTIVITY_UPDATE_PUBLISHED",
        "activityId", activityId,
        "activityTitle", activityTitle == null ? "你感兴趣的活动" : activityTitle,
        "updateId", updateId,
        "message", "你感兴趣的活动有新补充");
    Set<WebSocketSession> sessions = new LinkedHashSet<>();
    for (String userId : userIds == null ? Set.<String>of() : userIds) {
      sessions.addAll(notificationSessionManager.getSessionsForUser(userId));
    }
    for (String localSessionId : localSessionIds == null ? Set.<String>of() : localSessionIds) {
      sessions.addAll(notificationSessionManager.getSessionsForLocalSession(localSessionId));
    }
    if (sessions.isEmpty()) {
      return;
    }
    try {
      String serialized = objectMapper.writeValueAsString(payload);
      for (WebSocketSession session : sessions) {
        send(session, serialized);
      }
    } catch (Exception error) {
      log.warn("Activity Update notification serialization failed: activityId={} updateId={}", activityId, updateId, error);
    }
  }

  private void send(WebSocketSession session, String payload) {
    try {
      if (session.isOpen()) {
        session.sendMessage(new TextMessage(payload));
      }
    } catch (Exception error) {
      log.warn("Activity Update notification send failed: session={}", session.getId(), error);
    }
  }
}
