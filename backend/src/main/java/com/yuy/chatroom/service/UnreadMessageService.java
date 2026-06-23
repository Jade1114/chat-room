package com.yuy.chatroom.service;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.yuy.chatroom.mapper.MessageMapper;
import com.yuy.chatroom.mapper.ReadStateMapper;
import com.yuy.chatroom.model.Message;

@Service
public class UnreadMessageService {
  private static final Logger log = LoggerFactory.getLogger(UnreadMessageService.class);
  private static final String USER_UNREAD_KEY_PREFIX = "user:unread:";

  private final RedisTemplate<String, String> redisTemplate;
  private final ReadStateMapper readStateMapper;
  private final MessageMapper messageMapper;
  private final CampusDirectoryService campusDirectoryService;
  private final SessionManager sessionManager;

  public UnreadMessageService(
      RedisTemplate<String, String> redisTemplate,
      ReadStateMapper readStateMapper,
      MessageMapper messageMapper,
      CampusDirectoryService campusDirectoryService,
      SessionManager sessionManager) {
    this.redisTemplate = redisTemplate;
    this.readStateMapper = readStateMapper;
    this.messageMapper = messageMapper;
    this.campusDirectoryService = campusDirectoryService;
    this.sessionManager = sessionManager;
  }

  public Set<String> incrementUnreadForMessage(Message message) {
    Set<String> incrementedUserIds = new HashSet<>();
    if (message == null || message.getChannelId() == null || message.getUserId() == null) {
      return incrementedUserIds;
    }

    String channelId = message.getChannelId();
    Set<String> visibleUserIds = campusDirectoryService.getAccessibleUserIds(channelId);
    Set<String> viewingUserIds = sessionManager.getViewingUserIdsByChannelId(channelId);

    for (String userId : visibleUserIds) {
      if (userId.equals(message.getUserId()) || viewingUserIds.contains(userId)) {
        continue;
      }
      incrementUnread(userId, channelId);
      incrementedUserIds.add(userId);
    }
    return incrementedUserIds;
  }

  public void clearUnread(String userId, String channelId) {
    if (isBlank(userId) || isBlank(channelId)) {
      return;
    }

    try {
      redisTemplate.opsForHash().put(buildUserUnreadKey(userId), channelId, "0");
    } catch (Exception e) {
      log.warn("Redis 未读计数清零失败 userId={} channelId={}", userId, channelId, e);
    }

    Instant now = Instant.now();
    readStateMapper.upsert(userId, channelId, now, now);
  }

  public long getUnreadCount(String userId, String channelId) {
    if (isBlank(userId) || isBlank(channelId)) {
      return 0;
    }

    Long cached = readUnreadFromRedis(userId, channelId);
    if (cached != null) {
      return cached;
    }

    Instant lastReadAt = readStateMapper.findLastReadAt(userId, channelId);
    long rebuilt = lastReadAt == null ? 0 : messageMapper.countAfter(channelId, lastReadAt);
    writeUnreadToRedis(userId, channelId, rebuilt);
    return rebuilt;
  }

  private void incrementUnread(String userId, String channelId) {
    try {
      redisTemplate.opsForHash().increment(buildUserUnreadKey(userId), channelId, 1L);
    } catch (Exception e) {
      log.warn("Redis 未读计数增加失败 userId={} channelId={}", userId, channelId, e);
    }
  }

  private Long readUnreadFromRedis(String userId, String channelId) {
    try {
      Object value = redisTemplate.opsForHash().get(buildUserUnreadKey(userId), channelId);
      if (value == null) {
        return null;
      }
      return Long.parseLong(String.valueOf(value));
    } catch (Exception e) {
      log.warn("Redis 未读计数读取失败 userId={} channelId={}", userId, channelId, e);
      return null;
    }
  }

  private void writeUnreadToRedis(String userId, String channelId, long count) {
    try {
      redisTemplate.opsForHash().put(buildUserUnreadKey(userId), channelId, String.valueOf(count));
    } catch (Exception e) {
      log.warn("Redis 未读计数回填失败 userId={} channelId={}", userId, channelId, e);
    }
  }

  private String buildUserUnreadKey(String userId) {
    return USER_UNREAD_KEY_PREFIX + userId;
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
