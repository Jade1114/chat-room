package com.yuy.chatroom.service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

@Service
public class SessionManager {
    private final ConcurrentHashMap<WebSocketSession, String> sessionUsernameMap = new ConcurrentHashMap<>();

    public void addSession(WebSocketSession session, String username) {
        sessionUsernameMap.put(session, username);
    }

    public Set<WebSocketSession> getSessions() {
        return sessionUsernameMap.keySet();
    }

    public String getUsernameBySession(WebSocketSession session) {
        return sessionUsernameMap.get(session);
    }

    public String removeSession(WebSocketSession session) {
        return sessionUsernameMap.remove(session);
    }

    public void removeSessions(Set<WebSocketSession> sessions) {
        for (WebSocketSession webSocketSession : sessions) {
            sessionUsernameMap.remove(webSocketSession);
        }
    }
}
