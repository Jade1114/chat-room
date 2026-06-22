package com.yuy.chatroom.service;

import java.time.Instant;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import com.yuy.chatroom.model.CurrentUser;
import com.yuy.chatroom.model.Message;
import com.yuy.chatroom.model.MessageType;
import com.yuy.chatroom.model.UserSessionInfo;

@Service
public class MessageProcessor {
  private final static int DISPLAY_NAME_MAX_LENGTH = 20;
  private final static int MESSAGE_MAX_LENGTH = 100;
  private final static int CHANNEL_ID_MAX_LENGTH = 10;
  private final static Logger log = LoggerFactory.getLogger(MessageProcessor.class);

  private final SessionManager sessionManager;
  private final BroadcastDispatcher broadcastDispatcher;
  private final BroadcastService broadcastService;
  private final ChannelPresenceService channelPresenceService;
  private final ChatMessagePublisher chatMessagePublisher;
  private final CampusDirectoryService campusDirectoryService;

  public MessageProcessor(SessionManager sessionManager, BroadcastDispatcher broadcastDispatcher,
      BroadcastService broadcastService, ChannelPresenceService channelPresenceService,
      ChatMessagePublisher chatMessagePublisher, CampusDirectoryService campusDirectoryService) {
    this.sessionManager = sessionManager;
    this.broadcastDispatcher = broadcastDispatcher;
    this.broadcastService = broadcastService;
    this.channelPresenceService = channelPresenceService;
    this.chatMessagePublisher = chatMessagePublisher;
    this.campusDirectoryService = campusDirectoryService;
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
          message.setUserId(info.getUserId());
          message.setDisplayName(info.getDisplayName());
          message.setChannelId(info.getChannelId());
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
          CurrentUser user = campusDirectoryService.getCurrentUser(message.getUserId());

          String channelId = message.getChannelId();
          if (user == null || !campusDirectoryService.canAccess(user.getId(), channelId)) {
            log.warn("错误：用户无权访问频道, userId={}, channelId={}", message.getUserId(), channelId);
            return;
          }

          message.setUserId(user.getId());
          message.setDisplayName(user.getDisplayName());

          if (sessionManager.tryRegister(session, user.getId(), user.getDisplayName(), channelId)) {
            channelPresenceService.join(channelId, user.getId(), session.getId());
            log.info("{}, {} Redis 在线状态添加成功", user.getDisplayName(), channelId);
            broadcastDispatcher.submit(message);
          } else {
            log.warn("错误：Session 注册失败");
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
      Message message = new Message(MessageType.USER_LEAVE, info.getUserId(), info.getDisplayName(), "离开了当前频道",
          info.getChannelId());
      channelPresenceService.leave(info.getChannelId(), info.getUserId(), session.getId());
      log.info("{}, {} Redis 在线状态删除成功", message.getDisplayName(), info.getChannelId());
      broadcastDispatcher.submit(message);
    } else {
      log.warn("{} 未绑定用户信息但正在断开连接", session.getId());
    }
  }

  private void sendAck(WebSocketSession session, Message message, String status) {
    Message ack = new Message(MessageType.MESSAGE_ACK, "system", status, message.getChannelId());
    ack.setMessageId(message.getMessageId());
    ack.setSentAt(message.getSentAt());
    if (!broadcastService.sendMessage(session, ack)) {
      log.warn("消息回执发送失败, messageId={} status={}", message.getMessageId(), status);
    }
  }

  private boolean isValidJoinMessage(Message message) {
    String userId = message.getUserId();
    if (userId == null || userId.trim().isEmpty() || userId.matches(".*\\s.*")) {
      log.warn("错误：用户 ID 不合规");
      return false;
    }

    String displayName = message.getDisplayName();
    if (displayName == null || displayName.trim().isEmpty() || displayName.matches(".*\s.*") || displayName.length() > DISPLAY_NAME_MAX_LENGTH) {
      log.warn("错误：展示名称不合规");
      return false;
    }

    String channelId = message.getChannelId();
    if (channelId == null || channelId.trim().isEmpty() || channelId.matches(".*\s.*")
        || channelId.length() > CHANNEL_ID_MAX_LENGTH) {
      log.warn("错误：频道 ID 不合规");
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
