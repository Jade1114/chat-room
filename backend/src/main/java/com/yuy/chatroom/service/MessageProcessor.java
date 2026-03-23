package com.yuy.chatroom.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import com.yuy.chatroom.model.Message;
import com.yuy.chatroom.model.MessageType;

@Service
public class MessageProcessor {
    private final static int USERNAME_MAX_LENGTH = 20;
    private final static int MESSAGE_MAX_LENGTH = 100;
    private final static Logger log = LoggerFactory.getLogger(MessageProcessor.class);

    private final SessionManager sessionManager;
    private final BroadcastDispatcher broadcastDispatcher;

    public MessageProcessor(SessionManager sessionManager, BroadcastDispatcher broadcastDispatcher) {
        this.sessionManager = sessionManager;
        this.broadcastDispatcher = broadcastDispatcher;
    }

    public void processMessage(WebSocketSession session, Message message) {
        switch (message.getType()) {
            case USER_CHAT:
                if (isValidChatMessage(message, session)) {
                    String username = sessionManager.getUsernameBySession(session);
                    message.setSender(username);
                    broadcastDispatcher.submit(message);
                }
                break;
            case USER_JOIN:
                if (isValidJoinMessage(message)) {
                    if (sessionManager.tryRegister(session, message.getSender())) {
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
        String username = sessionManager.removeSession(session);
        if (username != null) {
            Message message = new Message(MessageType.USER_LEAVE, username, "离开了当前频道");
            broadcastDispatcher.submit(message);
        } else {
            log.warn("{} 未绑定用户名但正在断开连接", session.getId());
        }
    }

    private boolean isValidJoinMessage(Message message) {
        String temp = message.getSender();
        if (temp == null || temp.trim().isEmpty() || temp.matches(".*\\s.*") || temp.length() > USERNAME_MAX_LENGTH) {
            log.warn("错误：用户名不合规");
            return false;
        }
        return true;
    }

    private boolean isValidChatMessage(Message message, WebSocketSession session) {
        if (message.getContent() == null || message.getContent().trim().isEmpty()) {
            log.warn("错误：内容不合规");
            return false;
        }

        if (sessionManager.getUsernameBySession(session) == null) {
            log.warn("错误：发送者不存在");
            return false;
        }

        if (message.getContent().trim().length() > MESSAGE_MAX_LENGTH) {
            log.warn("错误：消息内容长度不合规");
            return false;
        }

        return true;
    }
}
