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
  private final ConcurrentHashMap<String, Set<WebSocketSession>> channelToSessionsMap = new ConcurrentHashMap<>();

  private final static Logger log = LoggerFactory.getLogger(SessionManager.class);

  public Set<WebSocketSession> getSessionsByChannelId(String channelId) {
    return channelToSessionsMap.getOrDefault(channelId, Set.of());
  }

  public UserSessionInfo getSessionInfo(WebSocketSession session) {
    return sessionToUserMap.get(session);
  }

  public synchronized UserSessionInfo removeSession(WebSocketSession session) {
    UserSessionInfo info = sessionToUserMap.remove(session);

    if (info == null) {
      return null;
    }

    Set<WebSocketSession> channelSessions = channelToSessionsMap.get(info.getChannelId());

    if (channelSessions != null) {
      channelSessions.remove(session);
      if (channelSessions.isEmpty()) {
        channelToSessionsMap.remove(info.getChannelId());
      }
    }
    return info;
  }

  public synchronized void removeSessions(Set<WebSocketSession> sessions) {
    for (WebSocketSession session : sessions) {
      removeSession(session);
    }
  }

  public synchronized boolean tryRegister(WebSocketSession session, String userId, String displayName, String channelId) {

    if (sessionToUserMap.containsKey(session)) {
      log.warn("当前Session: {} 已被使用", session.getId());
      return false;
    }

    Set<WebSocketSession> channelSessions = channelToSessionsMap.computeIfAbsent(channelId,
        key -> ConcurrentHashMap.newKeySet());

    sessionToUserMap.put(session, new UserSessionInfo(userId, displayName, channelId));
    channelSessions.add(session);
    return true;
  }

}
