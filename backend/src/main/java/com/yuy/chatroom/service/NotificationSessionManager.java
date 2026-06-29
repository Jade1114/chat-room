package com.yuy.chatroom.service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

@Service
public class NotificationSessionManager {
  private final ConcurrentHashMap<WebSocketSession, NotificationSessionInfo> sessionInfo = new ConcurrentHashMap<>();
  private final ConcurrentHashMap<String, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();
  private final ConcurrentHashMap<String, Set<WebSocketSession>> localSessionSessions = new ConcurrentHashMap<>();
  private final Logger log = LoggerFactory.getLogger(NotificationSessionManager.class);

  public void register(WebSocketSession session, String userId, String localSessionId) {
    NotificationSessionInfo info = new NotificationSessionInfo(clean(userId), clean(localSessionId));
    sessionInfo.put(session, info);
    if (info.userId() != null) {
      userSessions.computeIfAbsent(info.userId(), key -> ConcurrentHashMap.newKeySet()).add(session);
    }
    if (info.localSessionId() != null) {
      localSessionSessions.computeIfAbsent(info.localSessionId(), key -> ConcurrentHashMap.newKeySet()).add(session);
    }
    log.info("Notification session connected: session={}, userId={}, localSessionId={}",
        session.getId(), mask(info.userId()), mask(info.localSessionId()));
  }

  public void remove(WebSocketSession session) {
    NotificationSessionInfo info = sessionInfo.remove(session);
    if (info == null) {
      return;
    }
    removeFromIndex(userSessions, info.userId(), session);
    removeFromIndex(localSessionSessions, info.localSessionId(), session);
  }

  public Set<WebSocketSession> getSessionsForUser(String userId) {
    String cleaned = clean(userId);
    if (cleaned == null) {
      return Set.of();
    }
    return openSessions(userSessions.getOrDefault(cleaned, Set.of()));
  }

  public Set<WebSocketSession> getSessionsForLocalSession(String localSessionId) {
    String cleaned = clean(localSessionId);
    if (cleaned == null) {
      return Set.of();
    }
    return openSessions(localSessionSessions.getOrDefault(cleaned, Set.of()));
  }

  private Set<WebSocketSession> openSessions(Set<WebSocketSession> sessions) {
    return sessions.stream().filter(WebSocketSession::isOpen).collect(Collectors.toSet());
  }

  private void removeFromIndex(ConcurrentHashMap<String, Set<WebSocketSession>> index, String key, WebSocketSession session) {
    if (key == null) {
      return;
    }
    Set<WebSocketSession> sessions = index.get(key);
    if (sessions == null) {
      return;
    }
    sessions.remove(session);
    if (sessions.isEmpty()) {
      index.remove(key);
    }
  }

  private String clean(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value.trim();
  }

  private String mask(String value) {
    if (value == null) {
      return "-";
    }
    return value.length() <= 8 ? value : value.substring(0, 8) + "...";
  }

  private record NotificationSessionInfo(String userId, String localSessionId) {
  }
}
