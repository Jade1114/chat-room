package com.yuy.chatroom.service;

import java.time.Instant;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import com.yuy.chatroom.model.Message;
import com.yuy.chatroom.model.MessageType;
import com.yuy.chatroom.model.UserSessionInfo;

@Service
public class MessageProcessor {
    private final static int USERNAME_MAX_LENGTH = 20;
    private final static int MESSAGE_MAX_LENGTH = 100;
    private final static int ROOMID_MAX_LENGTH = 10;
    private final static Logger log = LoggerFactory.getLogger(MessageProcessor.class);

    private final SessionManager sessionManager;
    private final BroadcastDispatcher broadcastDispatcher;
    private final BroadcastService broadcastService;
    private final ChannelPresenceService channelPresenceService;
    private final ChatMessagePublisher chatMessagePublisher;

    public MessageProcessor(SessionManager sessionManager, BroadcastDispatcher broadcastDispatcher,
            BroadcastService broadcastService, ChannelPresenceService channelPresenceService,
            ChatMessagePublisher chatMessagePublisher) {
        this.sessionManager = sessionManager;
        this.broadcastDispatcher = broadcastDispatcher;
        this.broadcastService = broadcastService;
        this.channelPresenceService = channelPresenceService;
        this.chatMessagePublisher = chatMessagePublisher;
    }

    public void processMessage(WebSocketSession session, Message message) {
        if (message == null || message.getType() == null) {
            log.warn("消息类型不合规");
            return;
        }
        switch (message.getType()) {
            case USER_CHAT:
                if (isValidChatMessage(message, session)) {
                    UserSessionInfo info = sessionManager.getSessionInfo(session);
                    message.setSender(info.getUsername());
                    message.setRoomId(info.getRoomId());
                    message.setMessageId(UUID.randomUUID().toString());
                    message.setSentAt(Instant.now());
                    if (chatMessagePublisher.publishMessage(message)) {
                        sendAck(session, message, "ACCEPTED");
                    } else {
                        sendAck(session, message, "FAILED");
                        log.warn("消息发送失败, 详情: {}", message);
                    }
                }
                break;
            case USER_JOIN:
                if (isValidJoinMessage(message)) {
                    if (sessionManager.tryRegister(session, message.getSender(), message.getRoomId())) {
                        channelPresenceService.join(message.getRoomId(), message.getSender());
                        log.info("{}, {} Redis 在线状态添加成功", message.getSender(), message.getRoomId());
                        broadcastDispatcher.submit(message);
                    } else {
                        log.warn("错误：用户名已被占用");
                    }
                }
                break;
            // 当前离开事件由 handleDisconnect(...) 处理
            case USER_LEAVE:
                break;

            default:
                log.warn("前端发送了未知消息：" + message);
                break;
        }
    }

    public void handleDisconnect(WebSocketSession session) {
        UserSessionInfo info = sessionManager.removeSession(session);
        if (info != null) {
            Message message = new Message(MessageType.USER_LEAVE, info.getUsername(), "离开了当前频道", info.getRoomId());
            channelPresenceService.leave(info.getRoomId(), info.getUsername());
            log.info("{}, {} Redis 在线状态删除成功", message.getSender(), message.getRoomId());
            broadcastDispatcher.submit(message);
        } else {
            log.warn("{} 未绑定用户信息但正在断开连接", session.getId());
        }
    }

    private void sendAck(WebSocketSession session, Message message, String status) {
        Message ack = new Message(MessageType.MESSAGE_ACK, "system", status, message.getRoomId());
        ack.setMessageId(message.getMessageId());
        ack.setSentAt(message.getSentAt());
        if (!broadcastService.sendMessage(session, ack)) {
            log.warn("消息回执发送失败, messageId={} status={}", message.getMessageId(), status);
        }
    }

    private boolean isValidJoinMessage(Message message) {
        String name = message.getSender();
        if (name == null || name.trim().isEmpty() || name.matches(".*\\s.*") || name.length() > USERNAME_MAX_LENGTH) {
            log.warn("错误：用户名不合规");
            return false;
        }

        String roomId = message.getRoomId();
        if (roomId == null || roomId.trim().isEmpty() || roomId.matches(".*\\s.*")
                || roomId.length() > ROOMID_MAX_LENGTH) {
            log.warn("错误：房间名不合规");
            return false;
        }

        return true;
    }

    private boolean isValidChatMessage(Message message, WebSocketSession session) {
        if (message.getContent() == null || message.getContent().trim().isEmpty()) {
            log.warn("错误：内容不合规");
            return false;
        }

        if (sessionManager.getSessionInfo(session) == null) {
            log.warn("错误：当前 session 未注册用户信息");
            return false;
        }

        if (message.getContent().trim().length() > MESSAGE_MAX_LENGTH) {
            log.warn("错误：消息内容长度不合规");
            return false;
        }

        return true;
    }
}
