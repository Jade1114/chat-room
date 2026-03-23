package com.yuy.chatroom.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import com.yuy.chatroom.model.RoomDetail;
import com.yuy.chatroom.model.RoomSummary;
import com.yuy.chatroom.model.UserSessionInfo;

@Service
public class SessionManager {
    private final ConcurrentHashMap<WebSocketSession, UserSessionInfo> sessionToUserMap = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Set<WebSocketSession>> roomToSessionsMap = new ConcurrentHashMap<>();

    private final static Logger log = LoggerFactory.getLogger(SessionManager.class);

    public Set<WebSocketSession> getSessionsByRoomId(String roomId) {
        return roomToSessionsMap.getOrDefault(roomId, Set.of());
    }

    public UserSessionInfo getSessionInfo(WebSocketSession session) {
        return sessionToUserMap.get(session);
    }

    public synchronized UserSessionInfo removeSession(WebSocketSession session) {
        UserSessionInfo info = sessionToUserMap.remove(session);

        if (info == null) {
            return null;
        }

        Set<WebSocketSession> roomSessions = roomToSessionsMap.get(info.getRoomId());

        if (roomSessions != null) {
            roomSessions.remove(session);
            if (roomSessions.isEmpty()) {
                roomToSessionsMap.remove(info.getRoomId());
            }
        }
        return info;
    }

    public synchronized void removeSessions(Set<WebSocketSession> sessions) {
        for (WebSocketSession session : sessions) {
            removeSession(session);
        }
    }

    public synchronized boolean tryRegister(WebSocketSession session, String username, String roomId) {

        if (sessionToUserMap.containsKey(session)) {
            log.warn("当前Session: {} 已被使用", session.getId());
            return false;
        }

        Set<WebSocketSession> roomSessions = roomToSessionsMap.computeIfAbsent(roomId,
                key -> ConcurrentHashMap.newKeySet());

        for (WebSocketSession roomSession : roomSessions) {
            UserSessionInfo info = sessionToUserMap.get(roomSession);
            if (info != null && info.getUsername().equals(username)) {
                log.warn("当前房间内已有人使用此名称");
                return false;
            }
        }

        sessionToUserMap.put(session, new UserSessionInfo(username, roomId));
        roomSessions.add(session);
        return true;
    }

    public List<RoomSummary> getRoomSummaries() {
        List<RoomSummary> result = new ArrayList<>();

        for (Map.Entry<String, Set<WebSocketSession>> entry : roomToSessionsMap.entrySet()) {
            result.add(new RoomSummary(entry.getKey(), entry.getValue().size()));
        }
        return result;
    }

    public RoomDetail getRoomDetail(String roomId) {
        Set<WebSocketSession> roomSessions = roomToSessionsMap.get(roomId);
        if (roomSessions == null) {
            return null;
        }

        List<String> usernames = new ArrayList<>();
        for (WebSocketSession session : roomSessions) {
            UserSessionInfo info = sessionToUserMap.get(session);
            if (info != null) {
                usernames.add(info.getUsername());
            }
        }
        return new RoomDetail(roomId, usernames.size(), usernames);
    }
}
