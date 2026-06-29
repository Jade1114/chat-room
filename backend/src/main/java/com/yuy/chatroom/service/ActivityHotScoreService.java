package com.yuy.chatroom.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class ActivityHotScoreService {
  public static final String HOT_SCORE_KEY = "activity:hot_score";
  public static final double DETAIL_VIEW_WEIGHT = 1.0;
  public static final double PARTICIPATION_METHOD_VIEW_WEIGHT = 3.0;
  public static final double INTEREST_CREATED_WEIGHT = 5.0;

  private static final Logger log = LoggerFactory.getLogger(ActivityHotScoreService.class);

  private final RedisTemplate<String, String> redisTemplate;

  public ActivityHotScoreService(RedisTemplate<String, String> redisTemplate) {
    this.redisTemplate = redisTemplate;
  }

  public void incrementDetailView(String activityId) {
    increment(activityId, DETAIL_VIEW_WEIGHT, "DETAIL_VIEW");
  }

  public void incrementParticipationMethodView(String activityId) {
    increment(activityId, PARTICIPATION_METHOD_VIEW_WEIGHT, "PARTICIPATION_METHOD_VIEW");
  }

  public void incrementInterestCreated(String activityId, String eventId) {
    increment(activityId, INTEREST_CREATED_WEIGHT, "INTEREST_CREATED", eventId);
  }

  public List<String> rankActivityIds(List<String> visibleActivityIds) {
    if (visibleActivityIds == null || visibleActivityIds.isEmpty()) {
      return List.of();
    }
    try {
      Set<String> rankedIds = redisTemplate.opsForZSet().reverseRange(HOT_SCORE_KEY, 0, -1);
      if (rankedIds == null || rankedIds.isEmpty()) {
        return visibleActivityIds;
      }

      Set<String> visible = new HashSet<>(visibleActivityIds);
      Set<String> added = new HashSet<>();
      List<String> ordered = new ArrayList<>();
      for (String rankedId : rankedIds) {
        if (visible.contains(rankedId)) {
          ordered.add(rankedId);
          added.add(rankedId);
        }
      }
      for (String activityId : visibleActivityIds) {
        if (!added.contains(activityId)) {
          ordered.add(activityId);
        }
      }
      return ordered;
    } catch (Exception error) {
      log.warn("Redis hot score read failed, falling back to default feed order", error);
      return visibleActivityIds;
    }
  }

  public double score(String activityId) {
    if (activityId == null || activityId.isBlank()) {
      return 0;
    }
    try {
      Double score = redisTemplate.opsForZSet().score(HOT_SCORE_KEY, activityId);
      return score == null ? 0 : score;
    } catch (Exception error) {
      log.warn("Redis hot score read failed for activityId={}", activityId, error);
      return 0;
    }
  }

  private void increment(String activityId, double weight, String source) {
    increment(activityId, weight, source, null);
  }

  private void increment(String activityId, double weight, String source, String eventId) {
    if (activityId == null || activityId.isBlank()) {
      return;
    }
    try {
      redisTemplate.opsForZSet().incrementScore(HOT_SCORE_KEY, activityId, weight);
      log.debug("Activity hot score incremented: activityId={} source={} weight={} eventId={}",
          activityId, source, weight, eventId);
    } catch (Exception error) {
      log.warn("Redis hot score increment failed: activityId={} source={} weight={} eventId={}",
          activityId, source, weight, eventId, error);
    }
  }
}
