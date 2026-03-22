package com.yuy.chatroom.ws;

import java.util.HashSet;
import java.util.Set;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.yuy.chatroom.model.Message;
import com.yuy.chatroom.model.MessageType;

import tools.jackson.databind.ObjectMapper;

@Component
public class WebSocketHandler extends TextWebSocketHandler {

    private final Set<WebSocketSession> sessions = new HashSet<>();
    private final ObjectMapper objectMapper;

    public WebSocketHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        Message joinMessage = new Message(MessageType.USER_JOIN, session.getId(), "进入了当前频道");
        broadcastMessage(joinMessage);
        System.out.println("新连接建立: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();

        Message chatMessage = objectMapper.readValue(payload, Message.class);
        chatMessage.setSender(session.getId());

        broadcastMessage(chatMessage);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session);
        Message leaveMessage = new Message(MessageType.USER_LEAVE, session.getId(), "离开了当前频道");
        broadcastMessage(leaveMessage);
        System.out.println("连接关闭: " + session.getId());
    }

    private void broadcastMessage(Message message) throws Exception {
        String json = objectMapper.writeValueAsString(message);

        for (WebSocketSession targetSession : sessions) {
            if (targetSession.isOpen()) {
                targetSession.sendMessage(new TextMessage(json));
            }
        }
    }
}
