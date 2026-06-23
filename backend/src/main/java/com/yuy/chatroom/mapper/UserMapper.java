package com.yuy.chatroom.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import com.yuy.chatroom.model.CurrentUser;

@Mapper
public interface UserMapper {
  @Select("SELECT id, display_name, role, school_id, department_id, class_id FROM campus_user WHERE id = #{id}")
  CurrentUser findById(String id);

  @Select("SELECT id, display_name, role, school_id, department_id, class_id FROM campus_user")
  List<CurrentUser> findAll();

  @Select("SELECT course_id FROM user_course WHERE user_id = #{userId}")
  List<String> findCourseIdsByUserId(String userId);

  @Select("SELECT id, display_name, role, school_id, department_id, class_id FROM campus_user WHERE username = #{username}")
  CurrentUser findByUsername(String username);

  @Select("SELECT id, display_name, role, password_hash FROM campus_user WHERE username = #{username}")
  Map<String, Object> findAuthByUsername(String username);

  @Insert("INSERT INTO campus_user (id, username, display_name, password_hash, role, school_id, department_id, class_id) " +
          "VALUES (#{id}, #{username}, #{displayName}, #{passwordHash}, #{role}, #{schoolId}, #{departmentId}, #{classId})")
  void insertUser(@Param("id") String id, @Param("username") String username,
                  @Param("displayName") String displayName, @Param("passwordHash") String passwordHash,
                  @Param("role") String role, @Param("schoolId") String schoolId,
                  @Param("departmentId") String departmentId, @Param("classId") String classId);

  @Insert("INSERT INTO user_course (user_id, course_id) VALUES (#{userId}, #{courseId})")
  void insertUserCourse(@Param("userId") String userId, @Param("courseId") String courseId);

  @Delete("DELETE FROM user_course WHERE user_id = #{userId} AND course_id = #{courseId}")
  int deleteUserCourse(@Param("userId") String userId, @Param("courseId") String courseId);

  @Select("""
      SELECT uc.course_id, ch.name as channel_name, ch.id as channel_id
      FROM user_course uc
      JOIN campus_channel ch ON ch.scope_id = uc.course_id AND ch.type = 'COURSE'
      WHERE uc.user_id = #{userId}
      """)
  List<Map<String, Object>> findAssignedCoursesByUserId(String userId);

  @Update("UPDATE campus_user SET school_id = #{schoolId}, department_id = #{departmentId}, class_id = #{classId} WHERE id = #{userId}")
  int updateOrg(@Param("userId") String userId, @Param("schoolId") String schoolId,
                @Param("departmentId") String departmentId, @Param("classId") String classId);
}
