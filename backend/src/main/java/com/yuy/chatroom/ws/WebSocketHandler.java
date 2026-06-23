package com.yuy.chatroom.ws;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.yuy.chatroom.model.CurrentUser;
import com.yuy.chatroom.model.Message;
import com.yuy.chatroom.service.CampusDirectoryService;
import com.yuy.chatroom.service.ChannelPresenceService;
import com.yuy.chatroom.service.MessageProcessor;
import com.yuy.chatroom.service.SessionManager;

import com.fasterxml.jackson.core.JacksonException;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class WebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final MessageProcessor messageProcessor;
    private final SessionManager sessionManager;
    private final ChannelPresenceService channelPresenceService;
    private final CampusDirectoryService campusDirectoryService;
    private final static Logger log = LoggerFactory.getLogger(WebSocketHandler.class);

    public WebSocketHandler(ObjectMapper objectMapper, MessageProcessor messageProcessor,
            SessionManager sessionManager, ChannelPresenceService channelPresenceService,
            CampusDirectoryService campusDirectoryService) {
        this.objectMapper = objectMapper;
        this.messageProcessor = messageProcessor;
        this.sessionManager = sessionManager;
        this.channelPresenceService = channelPresenceService;
        this.campusDirectoryService = campusDirectoryService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String userId = (String) session.getAttributes().get("userId");
        String displayName = (String) session.getAttributes().get("displayName");

        if (userId == null) {
            log.warn("WebSocket 连接缺少 userId，关闭连接：{}", session.getId());
            try {
                session.close();
            } catch (Exception ignored) {
            }
            return;
        }

        // Verify user exists
        CurrentUser user = campusDirectoryService.getCurrentUser(userId);
        if (user == null) {
            log.warn("WebSocket userId 在数据库中不存在：{}", userId);
            try {
                session.close();
            } catch (Exception ignored) {
            }
            return;
        }

        if (displayName == null) {
            displayName = user.getDisplayName();
        }

        if (sessionManager.tryRegisterWorkspaceSession(session, user.getId(), displayName)) {
            channelPresenceService.connect(user.getId(), session.getId(), null);
            log.info("{}, workspace session 已连接（JWT 鉴权）", displayName);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            messageProcessor.processMessage(session, objectMapper.readValue(message.getPayload(), Message.class));
        } catch (JacksonException e) {
            log.warn("错误：收到非法消息/JSON 解析失败");
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        messageProcessor.handleDisconnect(session);
        log.info("连接关闭：{}", session.getId());
    }
}
