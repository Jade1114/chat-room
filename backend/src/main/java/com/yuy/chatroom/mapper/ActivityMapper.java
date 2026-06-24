package com.yuy.chatroom.mapper;

import java.time.Instant;
import java.util.List;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import com.yuy.chatroom.model.Activity;

@Mapper
public interface ActivityMapper {

  @Select("""
      SELECT id, organization_id, title, description, location,
             start_time, end_time, visibility, created_by, created_at
      FROM activity
      WHERE organization_id = #{organizationId}
        AND visibility = 'PUBLIC'
      ORDER BY start_time ASC
      """)
  List<Activity> findPublicByOrganizationId(String organizationId);

  @Select("""
      SELECT id, organization_id, title, description, location,
             start_time, end_time, visibility, created_by, created_at
      FROM activity
      WHERE visibility = 'PUBLIC'
        AND (end_time IS NULL OR end_time >= #{now})
      ORDER BY start_time ASC
      LIMIT #{limit}
      """)
  List<Activity> findUpcomingPublic(@Param("now") Instant now, @Param("limit") int limit);

  @Insert("""
      INSERT INTO activity (id, organization_id, title, description, location,
                            start_time, end_time, visibility, created_by, created_at)
      VALUES (#{id}, #{organizationId}, #{title}, #{description}, #{location},
              #{startTime}, #{endTime}, #{visibility}, #{createdBy}, #{createdAt})
      """)
  void insert(Activity activity);
}
