package com.yuy.chatroom.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import com.yuy.chatroom.model.ActivityUpdate;

@Mapper
public interface ActivityUpdateMapper {
  String UPDATE_COLUMNS = """
      au.id, au.activity_id, au.author_user_id, au.author_local_session_id,
      CASE
        WHEN au.author_user_id IS NULL AND au.author_local_session_id IS NOT NULL THEN '匿名发布者'
        ELSE u.display_name
      END AS author_display_name,
      au.content, au.created_at
      """;

  String UPDATE_FROM = """
      FROM activity_update au
      LEFT JOIN app_user u ON u.id = au.author_user_id
      """;

  @Insert("""
      INSERT INTO activity_update (id, activity_id, author_user_id, author_local_session_id, content, created_at)
      VALUES (#{id}, #{activityId}, #{authorUserId}, #{authorLocalSessionId}, #{content}, #{createdAt})
      """)
  void insert(ActivityUpdate update);

  @Select("""
      SELECT ${columns}
      ${fromClause}
      WHERE au.id = #{id}
      """)
  ActivityUpdate findById(@Param("columns") String columns, @Param("fromClause") String fromClause, @Param("id") String id);

  default ActivityUpdate findById(String id) {
    return findById(UPDATE_COLUMNS, UPDATE_FROM, id);
  }

  @Select("""
      SELECT ${columns}
      ${fromClause}
      WHERE au.activity_id = #{activityId}
      ORDER BY au.created_at DESC
      """)
  List<ActivityUpdate> findByActivityId(@Param("columns") String columns, @Param("fromClause") String fromClause,
      @Param("activityId") String activityId);

  default List<ActivityUpdate> findByActivityId(String activityId) {
    return findByActivityId(UPDATE_COLUMNS, UPDATE_FROM, activityId);
  }

  @Select("""
      SELECT DISTINCT user_id
      FROM activity_interest
      WHERE activity_id = #{activityId}
        AND user_id IS NOT NULL
      """)
  List<String> findInterestedUserIds(@Param("activityId") String activityId);

  @Select("""
      SELECT DISTINCT local_session_id
      FROM activity_interest
      WHERE activity_id = #{activityId}
        AND local_session_id IS NOT NULL
        AND local_session_id != ''
      """)
  List<String> findInterestedLocalSessionIds(@Param("activityId") String activityId);
}
