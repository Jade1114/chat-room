package com.yuy.chatroom.service;

import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yuy.chatroom.model.Activity;

@Service
public class ActivityInterestNotificationPublisher {
  private final NotificationSessionManager notificationSessionManager;
  private final ObjectMapper objectMapper;
  private final Logger log = LoggerFactory.getLogger(ActivityInterestNotificationPublisher.class);

  public ActivityInterestNotificationPublisher(NotificationSessionManager notificationSessionManager, ObjectMapper objectMapper) {
    this.notificationSessionManager = notificationSessionManager;
    this.objectMapper = objectMapper;
  }

  public void publishNewInterest(Activity activity, long interestCount) {
    if (activity == null) {
      return;
    }

    Map<String, Object> payload = Map.of(
        "type", "ACTIVITY_INTEREST_HINT",
        "activityId", activity.getId(),
        "activityTitle", activity.getTitle(),
        "interestCount", interestCount,
        "message", "有人对你的 Activity 感兴趣");

    Set<WebSocketSession> sessions = sessionsForInitiator(activity);
    if (sessions.isEmpty()) {
      return;
    }

    try {
      String serialized = objectMapper.writeValueAsString(payload);
      for (WebSocketSession session : sessions) {
        send(session, serialized);
      }
    } catch (Exception error) {
      log.warn("Activity Interest notification serialization failed: activityId={}", activity.getId(), error);
    }
  }

  private Set<WebSocketSession> sessionsForInitiator(Activity activity) {
    if (activity.getCreatedByUserId() != null && !activity.getCreatedByUserId().isBlank()) {
      return notificationSessionManager.getSessionsForUser(activity.getCreatedByUserId());
    }
    return notificationSessionManager.getSessionsForLocalSession(activity.getCreatedByLocalSessionId());
  }

  private void send(WebSocketSession session, String payload) {
    try {
      if (session.isOpen()) {
        session.sendMessage(new TextMessage(payload));
      }
    } catch (Exception error) {
      log.warn("Activity Interest notification send failed: session={}", session.getId(), error);
    }
  }
}
