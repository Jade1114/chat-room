package com.yuy.chatroom.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.yuy.chatroom.security.HandshakeAuthInterceptor;
import com.yuy.chatroom.security.NotificationHandshakeInterceptor;
import com.yuy.chatroom.ws.NotificationWebSocketHandler;
import com.yuy.chatroom.ws.WebSocketHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
  private final WebSocketHandler webSocketHandler;
  private final NotificationWebSocketHandler notificationWebSocketHandler;
  private final HandshakeAuthInterceptor handshakeAuthInterceptor;
  private final NotificationHandshakeInterceptor notificationHandshakeInterceptor;

  public WebSocketConfig(WebSocketHandler webSocketHandler,
      NotificationWebSocketHandler notificationWebSocketHandler,
      HandshakeAuthInterceptor handshakeAuthInterceptor,
      NotificationHandshakeInterceptor notificationHandshakeInterceptor) {
    this.webSocketHandler = webSocketHandler;
    this.notificationWebSocketHandler = notificationWebSocketHandler;
    this.handshakeAuthInterceptor = handshakeAuthInterceptor;
    this.notificationHandshakeInterceptor = notificationHandshakeInterceptor;
  }

  @Override
  public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    registry.addHandler(webSocketHandler, "/ws/chat")
        .addInterceptors(handshakeAuthInterceptor)
        .setAllowedOriginPatterns("*");
    registry.addHandler(notificationWebSocketHandler, "/ws/notifications")
        .addInterceptors(notificationHandshakeInterceptor)
        .setAllowedOriginPatterns("*");
  }
}