package com.yuy.chatroom.service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import com.yuy.chatroom.model.UserSessionInfo;

@Service
public class SessionManager {
  private final ConcurrentHashMap<WebSocketSession, UserSessionInfo> sessionToUserMap = new ConcurrentHashMap<>();
  private final ConcurrentHashMap<String, Set<WebSocketSession>> channelToViewingSessionsMap = new ConcurrentHashMap<>();

  private final static Logger log = LoggerFactory.getLogger(SessionManager.class);

  public Set<WebSocketSession> getSessionsByChannelId(String channelId) {
    return channelToViewingSessionsMap.getOrDefault(channelId, Set.of());
  }

  public UserSessionInfo getSessionInfo(WebSocketSession session) {
    return sessionToUserMap.get(session);
  }

  public synchronized UserSessionInfo removeSession(WebSocketSession session) {
    UserSessionInfo info = sessionToUserMap.remove(session);

    if (info == null) {
      return null;
    }

    removeFromCurrentChannel(session, info.getChannelId());
    return info;
  }

  public synchronized void removeSessions(Set<WebSocketSession> sessions) {
    for (WebSocketSession session : sessions) {
      removeSession(session);
    }
  }

  public synchronized boolean tryRegisterWorkspaceSession(WebSocketSession session, String userId, String displayName) {
    if (sessionToUserMap.containsKey(session)) {
      log.warn("当前Session: {} 已被使用", session.getId());
      return false;
    }

    sessionToUserMap.put(session, new UserSessionInfo(userId, displayName, null));
    return true;
  }

  public synchronized boolean updateCurrentChannel(WebSocketSession session, String channelId) {
    UserSessionInfo info = sessionToUserMap.get(session);
    if (info == null) {
      log.warn("当前Session: {} 尚未注册 workspace", session.getId());
      return false;
    }

    String previousChannelId = info.getChannelId();
    if (channelId.equals(previousChannelId)) {
      return true;
    }

    removeFromCurrentChannel(session, previousChannelId);
    info.setChannelId(channelId);

    Set<WebSocketSession> channelSessions = channelToViewingSessionsMap.computeIfAbsent(channelId,
        key -> ConcurrentHashMap.newKeySet());
    channelSessions.add(session);
    return true;
  }

  /**
   * Backward-compatible entry point for the old USER_JOIN flow.
   */
  public synchronized boolean tryRegister(WebSocketSession session, String userId, String displayName, String channelId) {
    if (!tryRegisterWorkspaceSession(session, userId, displayName)) {
      return false;
    }
    return updateCurrentChannel(session, channelId);
  }

  private void removeFromCurrentChannel(WebSocketSession session, String channelId) {
    if (channelId == null || channelId.isBlank()) {
      return;
    }

    Set<WebSocketSession> channelSessions = channelToViewingSessionsMap.get(channelId);
    if (channelSessions != null) {
      channelSessions.remove(session);
      if (channelSessions.isEmpty()) {
        channelToViewingSessionsMap.remove(channelId);
      }
    }
  }
}
