package com.yuy.chatroom.ws;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.yuy.chatroom.model.Message;
import com.yuy.chatroom.service.MessageProcessor;

import tools.jackson.databind.ObjectMapper;

@Component
public class WebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final MessageProcessor messageProcessor;

    public WebSocketHandler(ObjectMapper objectMapper, MessageProcessor messageProcessor) {
        this.objectMapper = objectMapper;
        this.messageProcessor = messageProcessor;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        System.out.println("新连接建立: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        messageProcessor.processMessage(session, objectMapper.readValue(message.getPayload(), Message.class));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        messageProcessor.handleDisconnect(session);
        System.out.println("连接关闭: " + session.getId());
    }
}
