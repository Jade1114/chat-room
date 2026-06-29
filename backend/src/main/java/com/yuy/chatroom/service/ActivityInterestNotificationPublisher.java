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

    publishHint(activity.getId(), activity.getTitle(), activity.getCreatedByUserId(), activity.getCreatedByLocalSessionId(), interestCount);
  }

  public void publishHint(String activityId, String activityTitle, String initiatorUserId,
      String initiatorLocalSessionId, long interestCount) {
    if (activityId == null || activityId.isBlank()) {
      return;
    }

    Map<String, Object> payload = Map.of(
        "type", "ACTIVITY_INTEREST_HINT",
        "activityId", activityId,
        "activityTitle", activityTitle == null ? "你的活动" : activityTitle,
        "interestCount", interestCount,
        "message", "有人对你的活动感兴趣");

    Set<WebSocketSession> sessions = sessionsForInitiator(initiatorUserId, initiatorLocalSessionId);
    if (sessions.isEmpty()) {
      return;
    }

    try {
      String serialized = objectMapper.writeValueAsString(payload);
      for (WebSocketSession session : sessions) {
        send(session, serialized);
      }
    } catch (Exception error) {
      log.warn("Activity Interest notification serialization failed: activityId={}", activityId, error);
    }
  }

  private Set<WebSocketSession> sessionsForInitiator(String initiatorUserId, String initiatorLocalSessionId) {
    if (initiatorUserId != null && !initiatorUserId.isBlank()) {
      return notificationSessionManager.getSessionsForUser(initiatorUserId);
    }
    return notificationSessionManager.getSessionsForLocalSession(initiatorLocalSessionId);
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
