package com.yuy.chatroom.service;

import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import com.yuy.chatroom.model.Message;

import tools.jackson.databind.ObjectMapper;

@Service
public class BroadcastService {
    private final ObjectMapper objectMapper;

    public BroadcastService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Set<WebSocketSession> broadcastMessage(Message message, Set<WebSocketSession> sessions)
            throws IOException {
        String json = objectMapper.writeValueAsString(message);
        Set<WebSocketSession> exceptionSessions = new HashSet<>();

        for (WebSocketSession targetSession : sessions) {
            if (targetSession.isOpen()) {
                try {
                    targetSession.sendMessage(new TextMessage(json));
                } catch (IOException e) {
                    exceptionSessions.add(targetSession);
                    e.printStackTrace();
                }
            }
        }

        return exceptionSessions;
    }
}
