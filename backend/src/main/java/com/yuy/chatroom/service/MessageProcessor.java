package com.yuy.chatroom.service;

import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import com.yuy.chatroom.model.Message;
import com.yuy.chatroom.model.MessageType;

@Service
public class MessageProcessor {
    private final BroadcastService broadcastService;
    private final SessionManager sessionManager;

    public MessageProcessor(BroadcastService broadcastService, SessionManager sessionManager) {
        this.broadcastService = broadcastService;
        this.sessionManager = sessionManager;
    }

    public void processMessage(WebSocketSession session, Message message) throws Exception {
        switch (message.getType()) {
            case USER_CHAT:
                String username = sessionManager.getUsernameBySession(session);
                if (username != null) {
                    message.setSender(username);
                    broadcastAndCleanup(message, sessionManager.getSessions());
                } else {
                    System.out.println("出现了错误，" + session.getId() + "没有保存用户名");
                }
                break;
            case USER_JOIN:
                sessionManager.addSession(session, message.getSender());
                broadcastAndCleanup(message, sessionManager.getSessions());
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

}
