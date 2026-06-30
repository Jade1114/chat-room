package com.yuy.chatroom.service;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.yuy.chatroom.mapper.ActivityMapper;
import com.yuy.chatroom.model.Activity;

@Service
public class ActivityExpirationService {
  public static final String EXPIRATION_INDEX_KEY = "activity:expires_at";
  public static final String EXPIRATION_LOCK_KEY = "activity:expiration:lock";

  private static final Logger log = LoggerFactory.getLogger(ActivityExpirationService.class);
  private static final Duration LOCK_TTL = Duration.ofSeconds(30);
  private static final int MAX_DUE_PER_TICK = 100;

  private final ActivityMapper activityMapper;
  private final RedisTemplate<String, String> redisTemplate;

  public ActivityExpirationService(ActivityMapper activityMapper, RedisTemplate<String, String> redisTemplate) {
    this.activityMapper = activityMapper;
    this.redisTemplate = redisTemplate;
  }

  public void indexActivity(Activity activity) {
    if (activity == null || activity.getId() == null || activity.getExpiresAt() == null) {
      return;
    }
    if (!"PUBLISHED".equals(activity.getStatus())) {
      removeActivity(activity.getId());
      return;
    }
    try {
      redisTemplate.opsForZSet().add(EXPIRATION_INDEX_KEY, activity.getId(), activity.getExpiresAt().toEpochMilli());
    } catch (Exception error) {
      log.warn("Redis activity expiration index write failed: activityId={}", activity.getId(), error);
    }
  }

  public void removeActivity(String activityId) {
    if (activityId == null || activityId.isBlank()) {
      return;
    }
    try {
      redisTemplate.opsForZSet().remove(EXPIRATION_INDEX_KEY, activityId);
    } catch (Exception error) {
      log.warn("Redis activity expiration index remove failed: activityId={}", activityId, error);
    }
  }

  @Scheduled(fixedDelayString = "${app.activity-expiration.fixed-delay-ms:60000}")
  public void expireDueActivities() {
    String lockToken = UUID.randomUUID().toString();
    if (!tryAcquireLock(lockToken)) {
      return;
    }
    try {
      syncExpirationIndexFromMySQL();
      List<String> dueActivityIds = dueActivityIds(Instant.now());
      if (dueActivityIds.isEmpty()) {
        return;
      }
      Instant now = Instant.now();
      int expired = activityMapper.expirePublishedByIds(dueActivityIds, now);
      removeActivities(dueActivityIds);
      log.info("Activity expiration tick completed: due={}, expired={}", dueActivityIds.size(), expired);
    } catch (Exception error) {
      log.warn("Activity expiration tick failed", error);
    } finally {
      releaseLock(lockToken);
    }
  }

  private void syncExpirationIndexFromMySQL() {
    try {
      for (Map<String, Object> row : activityMapper.findPublishedExpirationIndexRows()) {
        String id = String.valueOf(row.get("id"));
        Instant expiresAt = toInstant(row.get("expiresAt"));
        if (id == null || id.isBlank() || expiresAt == null) {
          continue;
        }
        redisTemplate.opsForZSet().add(EXPIRATION_INDEX_KEY, id, expiresAt.toEpochMilli());
      }
    } catch (Exception error) {
      log.warn("Activity expiration index sync failed; falling back to SQL expiration only", error);
      activityMapper.expireOutdated(Instant.now());
    }
  }

  private List<String> dueActivityIds(Instant now) {
    try {
      Set<String> ids = redisTemplate.opsForZSet().rangeByScore(
          EXPIRATION_INDEX_KEY, 0, now.toEpochMilli(), 0, MAX_DUE_PER_TICK);
      if (ids == null || ids.isEmpty()) {
        return List.of();
      }
      return new ArrayList<>(ids);
    } catch (Exception error) {
      log.warn("Redis activity expiration due lookup failed; falling back to SQL expiration only", error);
      activityMapper.expireOutdated(now);
      return List.of();
    }
  }

  private boolean tryAcquireLock(String lockToken) {
    try {
      Boolean acquired = redisTemplate.opsForValue().setIfAbsent(EXPIRATION_LOCK_KEY, lockToken, LOCK_TTL);
      return Boolean.TRUE.equals(acquired);
    } catch (Exception error) {
      log.warn("Redis activity expiration lock failed; running SQL fallback without distributed lock", error);
      activityMapper.expireOutdated(Instant.now());
      return false;
    }
  }

  private void releaseLock(String lockToken) {
    try {
      String currentToken = redisTemplate.opsForValue().get(EXPIRATION_LOCK_KEY);
      if (lockToken.equals(currentToken)) {
        redisTemplate.delete(EXPIRATION_LOCK_KEY);
      }
    } catch (Exception error) {
      log.warn("Redis activity expiration lock release failed", error);
    }
  }

  private void removeActivities(List<String> activityIds) {
    if (activityIds == null || activityIds.isEmpty()) {
      return;
    }
    try {
      redisTemplate.opsForZSet().remove(EXPIRATION_INDEX_KEY, activityIds.toArray());
    } catch (Exception error) {
      log.warn("Redis activity expiration index batch remove failed: size={}", activityIds.size(), error);
    }
  }

  private Instant toInstant(Object value) {
    if (value == null) {
      return null;
    }
    if (value instanceof Instant instant) {
      return instant;
    }
    if (value instanceof Timestamp timestamp) {
      return timestamp.toInstant();
    }
    if (value instanceof LocalDateTime localDateTime) {
      return localDateTime.toInstant(ZoneOffset.UTC);
    }
    return Instant.parse(String.valueOf(value));
  }
}
