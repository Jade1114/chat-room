package com.yuy.chatroom.security;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

@Component
public class HandshakeAuthInterceptor implements HandshakeInterceptor {

  private final JwtTokenProvider jwtTokenProvider;
  private final Logger log = LoggerFactory.getLogger(HandshakeAuthInterceptor.class);

  public HandshakeAuthInterceptor(JwtTokenProvider jwtTokenProvider) {
    this.jwtTokenProvider = jwtTokenProvider;
  }

  @Override
  public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
      WebSocketHandler wsHandler, Map<String, Object> attributes) {
    String query = request.getURI().getQuery();
    if (query == null) {
      return false;
    }

    String token = null;
    for (String param : query.split("&")) {
      if (param.startsWith("token=")) {
        token = param.substring(6);
        break;
      }
    }

    if (token == null) {
      log.warn("WebSocket 连接缺少 token");
      return false;
    }

    String userId = jwtTokenProvider.getUserId(token);
    if (userId == null) {
      log.warn("WebSocket token 验证失败");
      return false;
    }

    String role = jwtTokenProvider.getRole(token);
    String displayName = jwtTokenProvider.getDisplayName(token);
    if (displayName == null) {
      displayName = userId;
    }

    attributes.put("userId", userId);
    attributes.put("role", role);
    attributes.put("displayName", displayName);

    return true;
  }

  @Override
  public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
      WebSocketHandler wsHandler, Exception exception) {
    // no-op
  }
}
