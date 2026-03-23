package com.yuy.chatroom.ws;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.yuy.chatroom.model.Message;
import com.yuy.chatroom.service.MessageProcessor;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Component
public class WebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final MessageProcessor messageProcessor;
    private final static Logger log = LoggerFactory.getLogger(WebSocketHandler.class);

    public WebSocketHandler(ObjectMapper objectMapper, MessageProcessor messageProcessor) {
        this.objectMapper = objectMapper;
        this.messageProcessor = messageProcessor;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("新连接建立：{}", session.getId());
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
