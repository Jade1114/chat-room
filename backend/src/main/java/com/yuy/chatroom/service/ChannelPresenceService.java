package com.yuy.chatroom.service;

import java.util.Set;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Redis-backed source of truth for channel presence.
 *
 * <p>
 * Key pattern: {@code channel:presence:{channelId}} -> Redis Set of userIds.
 */
@Service
public class ChannelPresenceService {
  private static final String CHANNEL_PRESENCE_KEY_PREFIX = "channel:presence:";
  private static final String CHANNEL_USER_SESSIONS_KEY_PREFIX = "channel:user:sessions:";

  private final RedisTemplate<String, String> redisTemplate;

  public ChannelPresenceService(RedisTemplate<String, String> redisTemplate) {
    this.redisTemplate = redisTemplate;
  }

  /**
   * Register a user as online in a channel.
   * Idempotent because Redis Set ignores duplicate members.
   */

  public void join(String channelId, String userId, String sessionId) {
    redisTemplate.opsForSet().add(buildPresenceKey(channelId), userId);
    redisTemplate.opsForSet().add(buildUserSessionKey(channelId, userId), sessionId);
  }

  /**
   * Remove a user from a channel's online set.
   */

  public void leave(String channelId, String userId, String sessionId) {
    String userSessionsKey = buildUserSessionKey(channelId, userId);
    redisTemplate.opsForSet().remove(userSessionsKey, sessionId);

    Long remainingSessions = redisTemplate.opsForSet().size(userSessionsKey);
    if (remainingSessions == null || remainingSessions == 0) {
      redisTemplate.opsForSet().remove(buildPresenceKey(channelId), userId);
      redisTemplate.delete(userSessionsKey);
    }
  }

  /**
   * Returns a snapshot of online userIds for a channel.
   */
  public Set<String> getOnlineUserIds(String channelId) {
    Set<String> users = redisTemplate.opsForSet().members(buildPresenceKey(channelId));
    return users == null ? Set.of() : Set.copyOf(users);
  }

  /**
   * Returns the number of distinct online users in a channel.
   *
   * <p>
   * This counts userIds in {@code channel:presence:{channelId}}, not WebSocket
   * sessions. If the same user opens multiple tabs, they still count as 1.
   */
  public int getOnlineCount(String channelId) {
    Long size = redisTemplate.opsForSet().size(buildPresenceKey(channelId));
    return size == null ? 0 : size.intValue();
  }

  private String buildPresenceKey(String channelId) {
    return CHANNEL_PRESENCE_KEY_PREFIX + channelId;
  }

  private String buildUserSessionKey(String channelId, String userId) {
    return CHANNEL_USER_SESSIONS_KEY_PREFIX + channelId + ":" + userId;
  }

}
