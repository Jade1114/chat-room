package com.yuy.chatroom.service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

@Service
public class SessionManager {
    private final ConcurrentHashMap<WebSocketSession, String> sessionUsernameMap = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, WebSocketSession> usernameSessionMap = new ConcurrentHashMap<>();

    public Set<WebSocketSession> getSessions() {
        return sessionUsernameMap.keySet();
    }

    public String getUsernameBySession(WebSocketSession session) {
        return sessionUsernameMap.get(session);
    }

    public synchronized String removeSession(WebSocketSession session) {
        String result = sessionUsernameMap.remove(session);
        usernameSessionMap.remove(result);
        return result;
    }

    public synchronized void removeSessions(Set<WebSocketSession> sessions) {
        for (WebSocketSession webSocketSession : sessions) {
            usernameSessionMap.remove(sessionUsernameMap.remove(webSocketSession));
        }
    }

    public synchronized boolean tryRegister(WebSocketSession session, String username) {
        if (!usernameSessionMap.containsKey(username)) {
            usernameSessionMap.put(username, session);
            sessionUsernameMap.put(session, username);
            return true;
        } else {
            return false;
        }
    }
}
