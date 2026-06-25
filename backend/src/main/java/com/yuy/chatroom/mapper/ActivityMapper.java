package com.yuy.chatroom.mapper;

import java.time.Instant;
import java.util.List;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import com.yuy.chatroom.model.Activity;

@Mapper
public interface ActivityMapper {

  String ACTIVITY_COLUMNS = """
      a.id, a.title, a.description, a.category, a.tags, a.time_mode,
      a.start_time, a.end_time, a.expires_at, a.location, a.participation_method,
      a.status, a.created_by, u.display_name AS initiator_display_name,
      a.created_at, a.updated_at
      """;

  @Select("""
      <script>
      SELECT ${columns}
      FROM activity a
      JOIN app_user u ON u.id = a.created_by
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
  List<Activity> findFeed(@Param("columns") String columns, @Param("now") Instant now,
      @Param("query") String query, @Param("category") String category, @Param("tag") String tag);

  default List<Activity> findFeed(Instant now, String query, String category, String tag) {
    return findFeed(ACTIVITY_COLUMNS, now, query, category, tag);
  }

  @Select("""
      SELECT ${columns}
      FROM activity a
      JOIN app_user u ON u.id = a.created_by
      WHERE a.id = #{id}
      """)
  Activity findById(@Param("columns") String columns, @Param("id") String id);

  default Activity findById(String id) {
    return findById(ACTIVITY_COLUMNS, id);
  }

  @Select("""
      SELECT ${columns}
      FROM activity a
      JOIN app_user u ON u.id = a.created_by
      WHERE a.created_by = #{userId}
      ORDER BY a.created_at DESC
      """)
  List<Activity> findByCreatedBy(@Param("columns") String columns, @Param("userId") String userId);

  default List<Activity> findByCreatedBy(String userId) {
    return findByCreatedBy(ACTIVITY_COLUMNS, userId);
  }

  default List<Activity> findPublicByOrganizationId(String organizationId) {
    return java.util.List.of();
  }

  @Insert("""
      INSERT INTO activity (id, title, description, category, tags, time_mode,
                            start_time, end_time, expires_at, location,
                            participation_method, status, created_by, created_at, updated_at)
      VALUES (#{id}, #{title}, #{description}, #{category}, #{tags}, #{timeMode},
              #{startTime}, #{endTime}, #{expiresAt}, #{location},
              #{participationMethod}, #{status}, #{createdBy}, #{createdAt}, #{updatedAt})
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
      INSERT INTO activity_event (id, activity_id, user_id, event_type, created_at)
      VALUES (#{id}, #{activityId}, #{userId}, #{eventType}, #{createdAt})
      """)
  void insertEvent(@Param("id") String id, @Param("activityId") String activityId,
      @Param("userId") String userId, @Param("eventType") String eventType,
      @Param("createdAt") Instant createdAt);
}
