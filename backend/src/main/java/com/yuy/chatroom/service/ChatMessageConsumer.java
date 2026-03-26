package com.yuy.chatroom.service;

import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import com.yuy.chatroom.model.Message;

@Service
public class ChatMessageConsumer {
    private final BroadcastService broadcastService;
    private final SessionManager sessionManager;

    private final Logger log = LoggerFactory.getLogger(ChatMessageConsumer.class);

    public ChatMessageConsumer(BroadcastService broadcastService,
            SessionManager sessionManager) {
        this.broadcastService = broadcastService;
        this.sessionManager = sessionManager;
    }

    @RabbitListener(queues = "chat.queue.0", containerFactory = "rabbitListenerContainerFactory")
    public void consumeBucket0(Message message) {
        handleConsumedMessage(message);
    }

    @RabbitListener(queues = "chat.queue.1", containerFactory = "rabbitListenerContainerFactory")
    public void consumeBucket1(Message message) {
        handleConsumedMessage(message);
    }

    @RabbitListener(queues = "chat.queue.2", containerFactory = "rabbitListenerContainerFactory")
    public void consumeBucket2(Message message) {
        handleConsumedMessage(message);
    }

    @RabbitListener(queues = "chat.queue.3", containerFactory = "rabbitListenerContainerFactory")
    public void consumeBucket3(Message message) {
        handleConsumedMessage(message);
    }

    private boolean handleConsumedMessage(Message message) {
        if (message == null) {
            return false;
        }

        log.info("RabbitMQ 消费成功 roomId={} message={}", message.getRoomId(), message);

        try {
            Set<WebSocketSession> broadcastMessage = broadcastService.broadcastMessage(message,
                    sessionManager.getSessionsByRoomId(message.getRoomId()));
            sessionManager.removeSessions(broadcastMessage);
        } catch (Exception e) {
            log.warn("广播过程异常 消息：{} 房间号：{}", message, message.getRoomId());
            return false;
        }

        return true;
    }

}
