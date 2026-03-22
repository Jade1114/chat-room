package com.yuy.chatroom.service;

import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import com.yuy.chatroom.model.Message;
import com.yuy.chatroom.model.MessageType;

@Service
public class MessageProcessor {
    private final static int USERNAME_MAX_LENGTH = 20;
    private final static int MESSAGE_MAX_LENGTH = 100;

    private final BroadcastService broadcastService;
    private final SessionManager sessionManager;

    public MessageProcessor(BroadcastService broadcastService, SessionManager sessionManager) {
        this.broadcastService = broadcastService;
        this.sessionManager = sessionManager;
    }

    public void processMessage(WebSocketSession session, Message message) throws Exception {
        switch (message.getType()) {
            case USER_CHAT:
                if (isValidChatMessage(message, session)) {
                    String username = sessionManager.getUsernameBySession(session);
                    message.setSender(username);
                    broadcastAndCleanup(message, sessionManager.getSessions());
                }
                break;
            case USER_JOIN:
                if (isValidJoinMessage(message)) {
                    sessionManager.addSession(session, message.getSender());
                    broadcastAndCleanup(message, sessionManager.getSessions());
                }
                break;
            // 当前离开事件由 handleDisconnect(...) 处理
            case USER_LEAVE:
                break;

            default:
                System.out.println("前端发送了未知消息" + message);
                break;
        }
    }

    public void handleDisconnect(WebSocketSession session) throws Exception {
        String username = sessionManager.removeSession(session);
        if (username != null) {
            Message message = new Message(MessageType.USER_LEAVE, username, "离开了当前频道");
            broadcastAndCleanup(message, sessionManager.getSessions());
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

    private boolean isValidJoinMessage(Message message) {
        if (message.getSender() == null || message.getSender().trim().isEmpty()) {
            System.err.println("错误：用户名错误");
            return false;
        }

        if (sessionManager.isUsernameTaken(message.getSender())) {
            System.err.println("错误：用户名已存在");
            return false;
        }

        if (message.getSender().trim().length() > USERNAME_MAX_LENGTH) {
            System.err.println("错误：用户名长度不合规");
            return false;
        }

        return true;
    }

    private boolean isValidChatMessage(Message message, WebSocketSession session) {
        if (message.getContent() == null || message.getContent().trim().isEmpty()) {
            System.err.println("错误：内容不合规");
            return false;
        }

        if (sessionManager.getUsernameBySession(session) == null) {
            System.err.println("错误：发送者不存在");
            return false;
        }

        if (message.getContent().trim().length() > MESSAGE_MAX_LENGTH) {
            System.err.println("错误：消息内容长度不合规");
            return false;
        }

        return true;
    }


}
