package com.yuy.chatroom.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

@Service
public class ActivityRateLimitService {
  private static final Logger log = LoggerFactory.getLogger(ActivityRateLimitService.class);

  private static final int CREATE_ACTOR_LIMIT = 3;
  private static final int CREATE_IP_LIMIT = 10;
  private static final Duration CREATE_WINDOW = Duration.ofMinutes(1);

  private static final int INTEREST_ACTOR_CAPACITY = 10;
  private static final int INTEREST_ACTOR_REFILL_PER_SECOND = 10;
  private static final int INTEREST_IP_CAPACITY = 30;
  private static final int INTEREST_IP_REFILL_PER_SECOND = 30;

  private static final DefaultRedisScript<List> SLIDING_WINDOW_SCRIPT = new DefaultRedisScript<>("""
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local windowMs = tonumber(ARGV[2])
      local limit = tonumber(ARGV[3])
      local member = ARGV[4]
      redis.call('ZREMRANGEBYSCORE', key, 0, now - windowMs)
      local count = redis.call('ZCARD', key)
      if count >= limit then
        local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
        local retryAfter = 1
        if oldest[2] then
          retryAfter = math.max(1, math.ceil((tonumber(oldest[2]) + windowMs - now) / 1000))
        end
        return {0, retryAfter}
      end
      redis.call('ZADD', key, now, member)
      redis.call('PEXPIRE', key, windowMs)
      return {1, 0}
      """, List.class);

  private static final DefaultRedisScript<List> TOKEN_BUCKET_SCRIPT = new DefaultRedisScript<>("""
      local tokensKey = KEYS[1]
      local timestampKey = KEYS[2]
      local now = tonumber(ARGV[1])
      local capacity = tonumber(ARGV[2])
      local refillPerSecond = tonumber(ARGV[3])
      local requested = tonumber(ARGV[4])
      local ttlMs = tonumber(ARGV[5])

      local tokens = tonumber(redis.call('GET', tokensKey))
      if tokens == nil then tokens = capacity end
      local lastRefill = tonumber(redis.call('GET', timestampKey))
      if lastRefill == nil then lastRefill = now end

      local elapsedSeconds = math.max(0, (now - lastRefill) / 1000)
      tokens = math.min(capacity, tokens + elapsedSeconds * refillPerSecond)

      if tokens < requested then
        local missing = requested - tokens
        local retryAfter = math.max(1, math.ceil(missing / refillPerSecond))
        redis.call('SET', tokensKey, tokens, 'PX', ttlMs)
        redis.call('SET', timestampKey, now, 'PX', ttlMs)
        return {0, retryAfter}
      end

      tokens = tokens - requested
      redis.call('SET', tokensKey, tokens, 'PX', ttlMs)
      redis.call('SET', timestampKey, now, 'PX', ttlMs)
      return {1, 0}
      """, List.class);

  private final RedisTemplate<String, String> redisTemplate;

  public ActivityRateLimitService(RedisTemplate<String, String> redisTemplate) {
    this.redisTemplate = redisTemplate;
  }

  public void checkCreateActivity(String userId, String localSessionId, String clientIp) {
    String actor = actorIdentity(userId, localSessionId, clientIp);
    checkSlidingWindow(
        key("rate:activity:create:actor", actor),
        CREATE_ACTOR_LIMIT,
        CREATE_WINDOW,
        "发布太频繁了，请稍后再试");
    checkSlidingWindow(
        key("rate:activity:create:ip", clientIp),
        CREATE_IP_LIMIT,
        CREATE_WINDOW,
        "当前网络发布太频繁了，请稍后再试");
  }

  public void checkExpressInterest(String userId, String localSessionId, String clientIp) {
    String actor = actorIdentity(userId, localSessionId, clientIp);
    checkTokenBucket(
        key("rate:activity:interest:actor", actor),
        INTEREST_ACTOR_CAPACITY,
        INTEREST_ACTOR_REFILL_PER_SECOND,
        "表达兴趣太频繁了，请稍后再试");
    checkTokenBucket(
        key("rate:activity:interest:ip", clientIp),
        INTEREST_IP_CAPACITY,
        INTEREST_IP_REFILL_PER_SECOND,
        "当前网络表达兴趣太频繁了，请稍后再试");
  }

  private void checkSlidingWindow(String key, int limit, Duration window, String message) {
    try {
      List<?> result = redisTemplate.execute(SLIDING_WINDOW_SCRIPT,
          List.of(key),
          String.valueOf(System.currentTimeMillis()),
          String.valueOf(window.toMillis()),
          String.valueOf(limit),
          UUID.randomUUID().toString());
      throwIfLimited(result, message);
    } catch (RateLimitExceededException error) {
      throw error;
    } catch (Exception error) {
      log.warn("Redis sliding-window rate limit failed open: key={}", key, error);
    }
  }

  private void checkTokenBucket(String keyPrefix, int capacity, int refillPerSecond, String message) {
    try {
      List<?> result = redisTemplate.execute(TOKEN_BUCKET_SCRIPT,
          List.of(keyPrefix + ":tokens", keyPrefix + ":ts"),
          String.valueOf(System.currentTimeMillis()),
          String.valueOf(capacity),
          String.valueOf(refillPerSecond),
          "1",
          String.valueOf(Duration.ofMinutes(1).toMillis()));
      throwIfLimited(result, message);
    } catch (RateLimitExceededException error) {
      throw error;
    } catch (Exception error) {
      log.warn("Redis token-bucket rate limit failed open: keyPrefix={}", keyPrefix, error);
    }
  }

  private void throwIfLimited(List<?> result, String message) {
    if (result == null || result.isEmpty()) {
      return;
    }
    long allowed = toLong(result.get(0));
    long retryAfter = result.size() > 1 ? toLong(result.get(1)) : 1;
    if (allowed == 0) {
      throw new RateLimitExceededException(message, retryAfter);
    }
  }

  private long toLong(Object value) {
    if (value instanceof Number number) {
      return number.longValue();
    }
    return Long.parseLong(String.valueOf(value));
  }

  private String actorIdentity(String userId, String localSessionId, String clientIp) {
    String cleanedUserId = clean(userId);
    if (cleanedUserId != null) {
      return "user:" + cleanedUserId;
    }
    String cleanedLocalSessionId = clean(localSessionId);
    if (cleanedLocalSessionId != null) {
      return "local:" + cleanedLocalSessionId;
    }
    return "ip:" + cleanIp(clientIp);
  }

  private String key(String prefix, String rawIdentity) {
    return prefix + ":" + sha256(clean(rawIdentity) == null ? "unknown" : rawIdentity.trim());
  }

  private String cleanIp(String clientIp) {
    String cleaned = clean(clientIp);
    return cleaned == null ? "unknown" : cleaned;
  }

  private String clean(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value.trim();
  }

  private String sha256(String value) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(hash).substring(0, 24);
    } catch (NoSuchAlgorithmException error) {
      throw new IllegalStateException("SHA-256 is required", error);
    }
  }
}
