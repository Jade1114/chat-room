package com.yuy.chatroom.ws;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.yuy.chatroom.service.NotificationSessionManager;

@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {
  private final NotificationSessionManager notificationSessionManager;
  private final Logger log = LoggerFactory.getLogger(NotificationWebSocketHandler.class);

  public NotificationWebSocketHandler(NotificationSessionManager notificationSessionManager) {
    this.notificationSessionManager = notificationSessionManager;
  }

  @Override
  public void afterConnectionEstablished(WebSocketSession session) {
    String userId = (String) session.getAttributes().get("userId");
    String localSessionId = (String) session.getAttributes().get("localSessionId");
    if ((userId == null || userId.isBlank()) && (localSessionId == null || localSessionId.isBlank())) {
      log.warn("Notification WebSocket 缺少身份，关闭连接：{}", session.getId());
      closeQuietly(session);
      return;
    }
    notificationSessionManager.register(session, userId, localSessionId);
  }

  @Override
  public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
    notificationSessionManager.remove(session);
    log.info("Notification WebSocket closed: session={}, status={}", session.getId(), status);
  }

  @Override
  public void handleTransportError(WebSocketSession session, Throwable exception) {
    notificationSessionManager.remove(session);
    log.warn("Notification WebSocket transport error: session={}", session.getId(), exception);
  }

  private void closeQuietly(WebSocketSession session) {
    try {
      session.close();
    } catch (Exception ignored) {
      // no-op
    }
  }
}
