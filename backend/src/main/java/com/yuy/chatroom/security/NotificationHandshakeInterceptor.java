package com.yuy.chatroom.security;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

@Component
public class NotificationHandshakeInterceptor implements HandshakeInterceptor {

  private final JwtTokenProvider jwtTokenProvider;
  private final Logger log = LoggerFactory.getLogger(NotificationHandshakeInterceptor.class);

  public NotificationHandshakeInterceptor(JwtTokenProvider jwtTokenProvider) {
    this.jwtTokenProvider = jwtTokenProvider;
  }

  @Override
  public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
      WebSocketHandler wsHandler, Map<String, Object> attributes) {
    Map<String, String> params = parseQuery(request.getURI().getQuery());
    String localSessionId = clean(params.get("localSessionId"));
    String token = clean(params.get("token"));

    if (token != null) {
      String userId = jwtTokenProvider.getUserId(token);
      if (userId == null) {
        log.warn("Notification WebSocket token 验证失败");
        return false;
      }
      String displayName = jwtTokenProvider.getDisplayName(token);
      attributes.put("userId", userId);
      attributes.put("displayName", displayName == null ? userId : displayName);
    }

    if (localSessionId != null) {
      attributes.put("localSessionId", localSessionId);
    }

    if (!attributes.containsKey("userId") && !attributes.containsKey("localSessionId")) {
      log.warn("Notification WebSocket 缺少 userId/localSessionId 身份");
      return false;
    }

    return true;
  }

  @Override
  public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
      WebSocketHandler wsHandler, Exception exception) {
    // no-op
  }

  private Map<String, String> parseQuery(String query) {
    java.util.HashMap<String, String> params = new java.util.HashMap<>();
    if (query == null || query.isBlank()) {
      return params;
    }
    for (String pair : query.split("&")) {
      int index = pair.indexOf('=');
      if (index <= 0) {
        continue;
      }
      String key = decode(pair.substring(0, index));
      String value = decode(pair.substring(index + 1));
      params.put(key, value);
    }
    return params;
  }

  private String decode(String value) {
    return URLDecoder.decode(value, StandardCharsets.UTF_8);
  }

  private String clean(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value.trim();
  }
}
