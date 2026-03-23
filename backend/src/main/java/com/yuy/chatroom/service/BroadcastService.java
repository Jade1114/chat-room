package com.yuy.chatroom.service;

import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import com.yuy.chatroom.model.Message;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Service
public class BroadcastService {
    private final ObjectMapper objectMapper;
    private final Logger log = LoggerFactory.getLogger(BroadcastService.class);

    public BroadcastService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Set<WebSocketSession> broadcastMessage(Message message, Set<WebSocketSession> sessions)
            throws JacksonException {
        String json = objectMapper.writeValueAsString(message);
        Set<WebSocketSession> exceptionSessions = new HashSet<>();

        for (WebSocketSession targetSession : sessions) {
            if (targetSession.isOpen()) {
                try {
                    targetSession.sendMessage(new TextMessage(json));
                } catch (IOException e) {
                    exceptionSessions.add(targetSession);
                    log.warn("检测到失效 session，sessionId={}", targetSession.getId());
                }
            }
        }

        return exceptionSessions;
    }
}
