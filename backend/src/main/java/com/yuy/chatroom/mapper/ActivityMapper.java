package com.yuy.chatroom.mapper;

import java.time.Instant;
import java.util.List;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import com.yuy.chatroom.dto.AdminActivityMetric;
import com.yuy.chatroom.dto.AdminEventMetric;
import com.yuy.chatroom.model.Activity;

@Mapper
public interface ActivityMapper {

  String ACTIVITY_COLUMNS = """
      a.id, a.title, a.description, a.category, a.tags, a.time_mode,
      a.start_time, a.end_time, a.expires_at, a.location, a.participation_method,
      a.status, a.created_by, a.created_by_user_id, a.created_by_local_session_id,
      CASE
        WHEN a.created_by_user_id IS NULL AND a.created_by_local_session_id IS NOT NULL THEN '匿名发布者'
        ELSE u.display_name
      END AS initiator_display_name,
      a.created_at, a.updated_at
      """;

  String ACTIVITY_FROM = """
      FROM activity a
      LEFT JOIN app_user u ON u.id = COALESCE(a.created_by_user_id, a.created_by)
      """;

  @Select("""
      <script>
      SELECT ${columns}
      ${fromClause}
      WHERE a.status = 'PUBLISHED'
        AND (
          (a.time_mode = 'SCHEDULED' AND (a.end_time IS NULL OR a.end_time &gt;= #{now}))
          OR (a.time_mode = 'ONGOING' AND a.expires_at &gt;= #{now})
        )
        <if test="query != null and query != ''">
          AND (LOWER(a.title) LIKE CONCAT('%', LOWER(#{query}), '%')
            OR LOWER(a.description) LIKE CONCAT('%', LOWER(#{query}), '%')
            OR LOWER(a.tags) LIKE CONCAT('%', LOWER(#{query}), '%'))
        </if>
        <if test="category != null and category != ''">
          AND a.category = #{category}
        </if>
        <if test="tag != null and tag != ''">
          AND FIND_IN_SET(#{tag}, a.tags)
        </if>
      ORDER BY
        CASE WHEN a.time_mode = 'SCHEDULED' THEN 0 ELSE 1 END,
        a.start_time ASC,
        a.created_at DESC
      </script>
      """)
  List<Activity> findFeed(@Param("columns") String columns, @Param("fromClause") String fromClause,
      @Param("now") Instant now, @Param("query") String query,
      @Param("category") String category, @Param("tag") String tag);

  default List<Activity> findFeed(Instant now, String query, String category, String tag) {
    return findFeed(ACTIVITY_COLUMNS, ACTIVITY_FROM, now, query, category, tag);
  }

  @Select("""
      SELECT ${columns}
      ${fromClause}
      WHERE a.id = #{id}
      """)
  Activity findById(@Param("columns") String columns, @Param("fromClause") String fromClause, @Param("id") String id);

  default Activity findById(String id) {
    return findById(ACTIVITY_COLUMNS, ACTIVITY_FROM, id);
  }

  @Select("""
      SELECT ${columns}
      ${fromClause}
      WHERE a.created_by_user_id = #{userId}
      ORDER BY a.created_at DESC
      """)
  List<Activity> findByCreatedByUser(@Param("columns") String columns, @Param("fromClause") String fromClause,
      @Param("userId") String userId);

  default List<Activity> findByCreatedByUser(String userId) {
    return findByCreatedByUser(ACTIVITY_COLUMNS, ACTIVITY_FROM, userId);
  }

  @Select("""
      SELECT ${columns}
      ${fromClause}
      WHERE a.created_by_user_id IS NULL
        AND a.created_by_local_session_id = #{localSessionId}
      ORDER BY a.created_at DESC
      """)
  List<Activity> findByCreatedByLocalSession(@Param("columns") String columns, @Param("fromClause") String fromClause,
      @Param("localSessionId") String localSessionId);

  default List<Activity> findByCreatedByLocalSession(String localSessionId) {
    return findByCreatedByLocalSession(ACTIVITY_COLUMNS, ACTIVITY_FROM, localSessionId);
  }

  default List<Activity> findPublicByOrganizationId(String organizationId) {
    return java.util.List.of();
  }

  @Insert("""
      INSERT INTO activity (id, title, description, category, tags, time_mode,
                            start_time, end_time, expires_at, location,
                            participation_method, status, created_by, created_by_user_id,
                            created_by_local_session_id, created_at, updated_at)
      VALUES (#{id}, #{title}, #{description}, #{category}, #{tags}, #{timeMode},
              #{startTime}, #{endTime}, #{expiresAt}, #{location},
              #{participationMethod}, #{status}, #{createdBy}, #{createdByUserId},
              #{createdByLocalSessionId}, #{createdAt}, #{updatedAt})
      """)
  void insert(Activity activity);

  @Update("""
      UPDATE activity
      SET title = #{title}, description = #{description}, category = #{category}, tags = #{tags},
          time_mode = #{timeMode}, start_time = #{startTime}, end_time = #{endTime},
          expires_at = #{expiresAt}, location = #{location}, participation_method = #{participationMethod},
          status = #{status}, updated_at = #{updatedAt}
      WHERE id = #{id}
      """)
  void update(Activity activity);

  @Update("""
      UPDATE activity
      SET status = 'EXPIRED', updated_at = #{now}
      WHERE status = 'PUBLISHED'
        AND ((time_mode = 'SCHEDULED' AND end_time IS NOT NULL AND end_time < #{now})
          OR (time_mode = 'ONGOING' AND expires_at < #{now}))
      """)
  void expireOutdated(@Param("now") Instant now);

  @Insert("""
      INSERT INTO activity_event (id, activity_id, user_id, visitor_id, event_type, created_at)
      VALUES (#{id}, #{activityId}, #{userId}, #{localSessionId}, #{eventType}, #{createdAt})
      """)
  void insertEvent(@Param("id") String id, @Param("activityId") String activityId,
      @Param("userId") String userId, @Param("localSessionId") String localSessionId,
      @Param("eventType") String eventType, @Param("createdAt") Instant createdAt);

  @Insert("""
      INSERT INTO site_event (id, visitor_id, user_id, event_type, path, created_at)
      VALUES (#{id}, #{localSessionId}, #{userId}, #{eventType}, #{path}, #{createdAt})
      """)
  void insertSiteEvent(@Param("id") String id, @Param("localSessionId") String localSessionId,
      @Param("userId") String userId, @Param("eventType") String eventType,
      @Param("path") String path, @Param("createdAt") Instant createdAt);

  @Insert("""
      INSERT IGNORE INTO activity_interest (id, activity_id, user_id, local_session_id, created_at)
      VALUES (#{id}, #{activityId}, #{userId}, #{localSessionId}, #{createdAt})
      """)
  int insertInterest(@Param("id") String id, @Param("activityId") String activityId,
      @Param("userId") String userId, @Param("localSessionId") String localSessionId,
      @Param("createdAt") Instant createdAt);

  @Select("SELECT COUNT(*) FROM activity_interest WHERE activity_id = #{activityId}")
  long countInterests(@Param("activityId") String activityId);

  @Select("""
      SELECT COUNT(*) FROM activity_interest
      WHERE activity_id = #{activityId} AND user_id = #{userId}
      """)
  long hasUserInterest(@Param("activityId") String activityId, @Param("userId") String userId);

  @Select("""
      SELECT COUNT(*) FROM activity_interest
      WHERE activity_id = #{activityId} AND local_session_id = #{localSessionId}
      """)
  long hasLocalSessionInterest(@Param("activityId") String activityId, @Param("localSessionId") String localSessionId);

  @Update("""
      UPDATE activity_interest
      SET user_id = #{userId}, associated_at = #{associatedAt}
      WHERE activity_id = #{activityId}
        AND local_session_id = #{localSessionId}
        AND user_id IS NULL
      """)
  int associateLocalSessionInterest(@Param("activityId") String activityId,
      @Param("localSessionId") String localSessionId, @Param("userId") String userId,
      @Param("associatedAt") Instant associatedAt);

  @Update("""
      UPDATE activity
      SET created_by_user_id = #{userId}, created_by = #{userId}, updated_at = #{associatedAt}
      WHERE created_by_user_id IS NULL
        AND created_by_local_session_id = #{localSessionId}
      """)
  int associateLocalSessionActivities(@Param("localSessionId") String localSessionId,
      @Param("userId") String userId, @Param("associatedAt") Instant associatedAt);

  @Delete("""
      DELETE local_interest FROM activity_interest local_interest
      WHERE local_interest.local_session_id = #{localSessionId}
        AND local_interest.user_id IS NULL
        AND EXISTS (
          SELECT 1 FROM activity_interest user_interest
          WHERE user_interest.activity_id = local_interest.activity_id
            AND user_interest.user_id = #{userId}
        )
      """)
  int deleteDuplicateLocalSessionInterests(@Param("localSessionId") String localSessionId,
      @Param("userId") String userId);

  @Update("""
      UPDATE activity_interest
      SET user_id = #{userId}, associated_at = #{associatedAt}
      WHERE local_session_id = #{localSessionId}
        AND user_id IS NULL
      """)
  int associateLocalSessionInterests(@Param("localSessionId") String localSessionId,
      @Param("userId") String userId, @Param("associatedAt") Instant associatedAt);

  @Select("SELECT COUNT(DISTINCT visitor_id) FROM site_event WHERE event_type = 'SITE_VISIT' AND visitor_id IS NOT NULL AND visitor_id != ''")
  long countSiteVisitors();

  @Select("SELECT COUNT(*) FROM activity")
  long countActivities();

  @Select("SELECT COUNT(*) FROM activity WHERE status = #{status}")
  long countActivitiesByStatus(String status);

  @Select("SELECT COUNT(*) FROM activity_event WHERE event_type = #{eventType}")
  long countEventsByType(String eventType);

  @Select("""
      SELECT
        a.id AS activity_id,
        a.title AS title,
        a.category AS category,
        SUM(CASE WHEN e.event_type = 'DETAIL_VIEW' THEN 1 ELSE 0 END) AS detail_views,
        SUM(CASE WHEN e.event_type = 'PARTICIPATION_METHOD_VIEW' THEN 1 ELSE 0 END) AS participation_method_views
      FROM activity a
      LEFT JOIN activity_event e ON e.activity_id = a.id
      GROUP BY a.id, a.title, a.category
      ORDER BY participation_method_views DESC, detail_views DESC, a.created_at DESC
      LIMIT #{limit}
      """)
  List<AdminActivityMetric> findTopActivityMetrics(int limit);

  @Select("""
      SELECT
        e.activity_id AS activity_id,
        a.title AS title,
        e.event_type AS event_type,
        e.user_id AS user_id,
        e.visitor_id AS visitor_id,
        e.created_at AS created_at
      FROM activity_event e
      JOIN activity a ON a.id = e.activity_id
      ORDER BY e.created_at DESC
      LIMIT #{limit}
      """)
  List<AdminEventMetric> findRecentEventMetrics(int limit);
}
