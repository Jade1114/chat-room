package com.yuy.chatroom.service;

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
    private final RoomPresenceManager roomPresenceManager;

    public MessageProcessor(SessionManager sessionManager, BroadcastDispatcher broadcastDispatcher,
            RoomPresenceManager roomPresenceManager) {
        this.sessionManager = sessionManager;
        this.broadcastDispatcher = broadcastDispatcher;
        this.roomPresenceManager = roomPresenceManager;
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
                    broadcastDispatcher.submit(message);
                }
                break;
            case USER_JOIN:
                if (isValidJoinMessage(message)) {
                    if (sessionManager.tryRegister(session, message.getSender(), message.getRoomId())) {
                        boolean userToRoom = roomPresenceManager.addUserToRoom(message.getSender(),
                                message.getRoomId());
                        if (userToRoom == false) {
                            for (int i = 0; i < 3; i++) {
                                userToRoom = roomPresenceManager.addUserToRoom(message.getSender(),
                                        message.getRoomId());
                                if (userToRoom) {
                                    break;
                                }
                            }
                            if (userToRoom == false) {
                                log.warn("{}, {} redis 映射添加失败", message.getSender(), message.getRoomId());
                            } else {
                                log.info("{}, {} redis 映射添加成功", message.getSender(), message.getRoomId());
                            }
                        } else {
                            log.info("{}, {} redis 映射添加成功", message.getSender(), message.getRoomId());
                        }

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
            boolean removeUserFromRoom = roomPresenceManager.removeUserFromRoom(message.getSender(),
                    message.getRoomId());
            if (removeUserFromRoom) {
                log.info("{}, {} redis映射删除成功", message.getSender(), message.getRoomId());
            } else {
                for (int i = 0; i < 3; i++) {
                    removeUserFromRoom = roomPresenceManager.removeUserFromRoom(message.getSender(),
                            message.getRoomId());
                    if (removeUserFromRoom) {
                        log.info("{}, {} redis映射删除成功", message.getSender(), message.getRoomId());
                        break;
                    }
                }
                if (removeUserFromRoom == false) {
                    log.warn("{}, {} redis映射删除失败, 请注意检查redis", message.getSender(), message.getRoomId());
                }
            }
            broadcastDispatcher.submit(message);
        } else {
            log.warn("{} 未绑定用户信息但正在断开连接", session.getId());
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
