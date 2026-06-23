package com.yuy.chatroom.service;

import java.util.Set;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Redis-backed workspace presence.
 *
 * <p>
 * Key patterns:
 * <ul>
 * <li>{@code workspace:online} -> Redis Set of online userIds</li>
 * <li>{@code workspace:user:sessions:{userId}} -> Redis Set of active sessionIds</li>
 * <li>{@code workspace:session:user:{sessionId}} -> userId reverse lookup</li>
 * <li>{@code workspace:session:channel:{sessionId}} -> current viewed channelId</li>
 * <li>{@code channel:viewing:{channelId}} -> Redis Set of sessionIds currently viewing the channel</li>
 * </ul>
 */
@Service
public class ChannelPresenceService {
  private static final String WORKSPACE_ONLINE_KEY = "workspace:online";
  private static final String WORKSPACE_USER_SESSIONS_KEY_PREFIX = "workspace:user:sessions:";
  private static final String WORKSPACE_SESSION_USER_KEY_PREFIX = "workspace:session:user:";
  private static final String WORKSPACE_SESSION_CHANNEL_KEY_PREFIX = "workspace:session:channel:";
  private static final String CHANNEL_VIEWING_KEY_PREFIX = "channel:viewing:";

  private final RedisTemplate<String, String> redisTemplate;

  public ChannelPresenceService(RedisTemplate<String, String> redisTemplate) {
    this.redisTemplate = redisTemplate;
  }

  /**
   * Mark a session as connected to the workspace and record its current channel.
   */
  public void connect(String userId, String sessionId, String channelId) {
    redisTemplate.opsForSet().add(WORKSPACE_ONLINE_KEY, userId);
    redisTemplate.opsForSet().add(buildUserSessionsKey(userId), sessionId);
    redisTemplate.opsForValue().set(buildSessionUserKey(sessionId), userId);
    if (channelId != null && !channelId.isBlank()) {
      setCurrentChannel(sessionId, channelId);
    }
  }

  /**
   * Update which channel a session is currently viewing. This is view state only;
   * workspace online state does not depend on the current channel.
   */
  public void setCurrentChannel(String sessionId, String channelId) {
    String previousChannelId = redisTemplate.opsForValue().get(buildSessionChannelKey(sessionId));
    if (previousChannelId != null && !previousChannelId.equals(channelId)) {
      redisTemplate.opsForSet().remove(buildChannelViewingKey(previousChannelId), sessionId);
    }

    redisTemplate.opsForValue().set(buildSessionChannelKey(sessionId), channelId);
    redisTemplate.opsForSet().add(buildChannelViewingKey(channelId), sessionId);
  }

  /**
   * Remove a session from workspace presence. The user remains online if another
   * browser tab/session is still connected.
   */
  public void disconnect(String userId, String sessionId) {
    String currentChannelId = redisTemplate.opsForValue().get(buildSessionChannelKey(sessionId));
    if (currentChannelId != null) {
      redisTemplate.opsForSet().remove(buildChannelViewingKey(currentChannelId), sessionId);
    }

    String userSessionsKey = buildUserSessionsKey(userId);
    redisTemplate.opsForSet().remove(userSessionsKey, sessionId);

    Long remainingSessions = redisTemplate.opsForSet().size(userSessionsKey);
    if (remainingSessions == null || remainingSessions == 0) {
      redisTemplate.opsForSet().remove(WORKSPACE_ONLINE_KEY, userId);
      redisTemplate.delete(userSessionsKey);
    }

    redisTemplate.delete(buildSessionUserKey(sessionId));
    redisTemplate.delete(buildSessionChannelKey(sessionId));
  }

  /**
   * Returns a snapshot of all users currently online in the workspace.
   */
  public Set<String> getWorkspaceOnlineUserIds() {
    Set<String> users = redisTemplate.opsForSet().members(WORKSPACE_ONLINE_KEY);
    return users == null ? Set.of() : Set.copyOf(users);
  }

  private String buildUserSessionsKey(String userId) {
    return WORKSPACE_USER_SESSIONS_KEY_PREFIX + userId;
  }

  private String buildSessionUserKey(String sessionId) {
    return WORKSPACE_SESSION_USER_KEY_PREFIX + sessionId;
  }

  private String buildSessionChannelKey(String sessionId) {
    return WORKSPACE_SESSION_CHANNEL_KEY_PREFIX + sessionId;
  }

  private String buildChannelViewingKey(String channelId) {
    return CHANNEL_VIEWING_KEY_PREFIX + channelId;
  }
}
