package com.yuy.chatroom.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.yuy.chatroom.security.HandshakeAuthInterceptor;
import com.yuy.chatroom.ws.WebSocketHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
  private final WebSocketHandler webSocketHandler;
  private final HandshakeAuthInterceptor handshakeAuthInterceptor;

  public WebSocketConfig(WebSocketHandler webSocketHandler,
      HandshakeAuthInterceptor handshakeAuthInterceptor) {
    this.webSocketHandler = webSocketHandler;
    this.handshakeAuthInterceptor = handshakeAuthInterceptor;
  }

  @Override
  public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    registry.addHandler(webSocketHandler, "/ws/chat")
        .addInterceptors(handshakeAuthInterceptor)
        .setAllowedOriginPatterns("*");
  }
}