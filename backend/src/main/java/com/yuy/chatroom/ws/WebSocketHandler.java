package com.yuy.chatroom.ws;

import java.util.Set;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.yuy.chatroom.model.Message;
import com.yuy.chatroom.model.MessageType;
import com.yuy.chatroom.service.BroadcastService;
import com.yuy.chatroom.service.SessionManager;

import tools.jackson.databind.ObjectMapper;

@Component
public class WebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final BroadcastService broadcastService;
    private final SessionManager sessionManager;

    public WebSocketHandler(ObjectMapper objectMapper, BroadcastService broadcastService,
            SessionManager sessionManager) {
        this.objectMapper = objectMapper;
        this.broadcastService = broadcastService;
        this.sessionManager = sessionManager;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        System.out.println("新连接建立: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Message newMessage = objectMapper.readValue(message.getPayload(), Message.class);

        switch (newMessage.getType()) {
            case USER_JOIN:
                sessionManager.addSession(session, newMessage.getSender());
                broadcastAndCleanup(newMessage, sessionManager.getSessions());
                break;
            case USER_LEAVE:
                break;
            case USER_CHAT:
                String username = sessionManager.getUsernameBySession(session);
                if (username != null) {
                    newMessage.setSender(username);
                    broadcastAndCleanup(newMessage, sessionManager.getSessions());
                } else {
                    System.out.println("出现了错误，" + session.getId() + "没有保存用户名");
                }

                break;
            default:
                System.out.println("前端发送了未知消息" + newMessage);
                break;
        }

    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String username = sessionManager.removeSession(session);
        if (username != null) {
            Message leaveMessage = new Message(MessageType.USER_LEAVE, username, "离开了当前频道");
            broadcastAndCleanup(leaveMessage, sessionManager.getSessions());
            System.out.println("连接关闭: " + session.getId());
        } else {
            System.out.println(session.getId() + "未绑定用户名但正在断开连接");
        }
    }

    private void removeExceptionSession(Set<WebSocketSession> sessions) {
        sessionManager.removeSessions(sessions);
    }

    private void broadcastAndCleanup(Message message, Set<WebSocketSession> sessions) throws Exception {
        Set<WebSocketSession> exceptionSessions = broadcastService.broadcastMessage(message,
                sessions);
        removeExceptionSession(exceptionSessions);
    }
}
