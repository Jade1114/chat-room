package com.yuy.chatroom.service;

import java.util.Set;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Redis-backed source of truth for channel presence.
 *
 * <p>Key pattern: {@code channel:presence:{channelId}} -> Redis Set of userIds.
 */
@Service
public class ChannelPresenceService {
    private static final String CHANNEL_PRESENCE_KEY_PREFIX = "channel:presence:";

    private final RedisTemplate<String, String> redisTemplate;

    public ChannelPresenceService(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Register a user as online in a channel.
     * Idempotent because Redis Set ignores duplicate members.
     */
    public void join(String channelId, String userId) {
        redisTemplate.opsForSet().add(buildPresenceKey(channelId), userId);
    }

    /**
     * Remove a user from a channel's online set.
     */
    public void leave(String channelId, String userId) {
        redisTemplate.opsForSet().remove(buildPresenceKey(channelId), userId);
    }

    /**
     * Remove a user from all known channel presence sets.
     */
    public void leaveAllChannels(String userId) {
        Set<String> keys = redisTemplate.keys(CHANNEL_PRESENCE_KEY_PREFIX + "*");
        if (keys == null || keys.isEmpty()) {
            return;
        }

        for (String key : keys) {
            redisTemplate.opsForSet().remove(key, userId);
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
     * Returns the number of online users in a channel.
     */
    public int getOnlineCount(String channelId) {
        Long size = redisTemplate.opsForSet().size(buildPresenceKey(channelId));
        return size == null ? 0 : size.intValue();
    }

    private String buildPresenceKey(String channelId) {
        return CHANNEL_PRESENCE_KEY_PREFIX + channelId;
    }
}
