package com.yuy.chatroom.service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

/**
 * Tracks which users are currently online in each channel.
 *
 * <p>⚠️ TODO: Redis — migrate from ConcurrentHashMap to Redis Set/SortedSet
 * for cross-node presence when the system goes multi-instance.
 * The Redis key pattern would be: {@code channel:presence:{channelId}} (Set of userIds).
 *
 * <p>⚠️ TODO: WebSocket lifecycle — wire {@link #join} and {@link #leave} into
 * WebSocket connection/disconnection events, replacing the current
 * {@code SessionManager} room-based tracking.
 *
 * <p>⚠️ TODO: Multi-threading — current ConcurrentHashMap is thread-safe for
 * single-node operations. Multi-node deployment requires Redis Pub/Sub to
 * propagate join/leave events across instances.
 */
@Service
public class ChannelPresenceService {
    private final ConcurrentHashMap<String, Set<String>> channelOnlineUsers = new ConcurrentHashMap<>();

    /**
     * Register a user as online in a channel.
     * Idempotent — calling join twice for the same user and channel is safe.
     */
    public void join(String channelId, String userId) {
        channelOnlineUsers
                .computeIfAbsent(channelId, key -> ConcurrentHashMap.newKeySet())
                .add(userId);
    }

    /**
     * Remove a user from a channel's online set.
     * Safe to call even if the user or channel doesn't exist.
     */
    public void leave(String channelId, String userId) {
        Set<String> users = channelOnlineUsers.get(channelId);
        if (users != null) {
            users.remove(userId);
        }
    }

    /**
     * Remove a user from ALL channels they are in.
     * Called on WebSocket disconnect when we don't know which channel(s) the session is in.
     *
     * <p>⚠️ TODO: Multi-threading — this is O(channel count). If many channels exist,
     * consider maintaining a reverse index {@code userId -> Set<channelId>}.
     */
    public void leaveAllChannels(String userId) {
        channelOnlineUsers.values().forEach(users -> users.remove(userId));
    }

    /**
     * Returns a snapshot of online userIds for a channel.
     * Returns an empty set (not null) for unknown channels.
     */
    public Set<String> getOnlineUserIds(String channelId) {
        Set<String> users = channelOnlineUsers.get(channelId);
        return users == null ? Set.of() : Set.copyOf(users);
    }

    /**
     * Returns the number of online users in a channel.
     */
    public int getOnlineCount(String channelId) {
        Set<String> users = channelOnlineUsers.get(channelId);
        return users == null ? 0 : users.size();
    }
}
