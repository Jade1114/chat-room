package com.yuy.chatroom.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yuy.chatroom.mapper.MessageMapper;
import com.yuy.chatroom.model.Message;

@Service
public class MessageHistoryService {
  private static final Logger log = LoggerFactory.getLogger(MessageHistoryService.class);
  private static final String CHANNEL_MESSAGES_KEY_PREFIX = "channel:messages:";
  private static final int MAX_RECENT_CACHE_SIZE = 100;
  private static final int DEFAULT_LIMIT = 50;
  private static final int MAX_LIMIT = 100;

  private final MessageMapper messageMapper;
  private final RedisTemplate<String, String> redisTemplate;
  private final ObjectMapper objectMapper;

  public MessageHistoryService(MessageMapper messageMapper, RedisTemplate<String, String> redisTemplate,
      ObjectMapper objectMapper) {
    this.messageMapper = messageMapper;
    this.redisTemplate = redisTemplate;
    this.objectMapper = objectMapper;
  }

  public Message saveUserMessage(Message message) {
    messageMapper.insert(message);
    cacheRecentMessage(message);
    return message;
  }

  public List<Message> getRecentMessages(String channelId, Integer requestedLimit) {
    int limit = normalizeLimit(requestedLimit);
    List<Message> cached = readRecentFromCache(channelId, limit);
    if (!cached.isEmpty()) {
      return cached;
    }

    List<Message> messages = newestFirstToOldestFirst(messageMapper.findRecentByChannelId(channelId, limit));
    backfillRecentCache(channelId, messages);
    return messages;
  }

  public List<Message> getMessagesBefore(String channelId, Instant before, Integer requestedLimit) {
    int limit = normalizeLimit(requestedLimit);
    return newestFirstToOldestFirst(messageMapper.findBeforeByChannelId(channelId, before, limit));
  }

  private void cacheRecentMessage(Message message) {
    try {
      String key = buildChannelMessagesKey(message.getChannelId());
      redisTemplate.opsForList().leftPush(key, objectMapper.writeValueAsString(message));
      redisTemplate.opsForList().trim(key, 0, MAX_RECENT_CACHE_SIZE - 1);
    } catch (Exception e) {
      log.warn("Redis 最近消息缓存写入失败 channelId={} messageId={}", message.getChannelId(), message.getMessageId(), e);
    }
  }

  private void backfillRecentCache(String channelId, List<Message> messages) {
    if (messages.isEmpty()) {
      return;
    }

    try {
      String key = buildChannelMessagesKey(channelId);
      redisTemplate.delete(key);
      for (int i = messages.size() - 1; i >= 0; i--) {
        redisTemplate.opsForList().leftPush(key, objectMapper.writeValueAsString(messages.get(i)));
      }
      redisTemplate.opsForList().trim(key, 0, MAX_RECENT_CACHE_SIZE - 1);
    } catch (Exception e) {
      log.warn("Redis 最近消息缓存回填失败 channelId={}", channelId, e);
    }
  }

  private List<Message> readRecentFromCache(String channelId, int limit) {
    try {
      List<String> cached = redisTemplate.opsForList().range(buildChannelMessagesKey(channelId), 0, limit - 1);
      if (cached == null || cached.isEmpty()) {
        return List.of();
      }

      List<Message> messages = new ArrayList<>();
      for (String value : cached) {
        messages.add(objectMapper.readValue(value, Message.class));
      }
      Collections.reverse(messages);
      return messages;
    } catch (JsonProcessingException e) {
      log.warn("Redis 最近消息缓存反序列化失败 channelId={}", channelId, e);
      return List.of();
    } catch (Exception e) {
      log.warn("Redis 最近消息缓存读取失败 channelId={}", channelId, e);
      return List.of();
    }
  }

  private List<Message> newestFirstToOldestFirst(List<Message> messages) {
    List<Message> result = new ArrayList<>(messages);
    Collections.reverse(result);
    return result;
  }

  private int normalizeLimit(Integer requestedLimit) {
    if (requestedLimit == null || requestedLimit <= 0) {
      return DEFAULT_LIMIT;
    }
    return Math.min(requestedLimit, MAX_LIMIT);
  }

  private String buildChannelMessagesKey(String channelId) {
    return CHANNEL_MESSAGES_KEY_PREFIX + channelId;
  }
}
