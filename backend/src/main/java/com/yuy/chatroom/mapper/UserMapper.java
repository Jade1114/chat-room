package com.yuy.chatroom.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import com.yuy.chatroom.model.CurrentUser;

@Mapper
public interface UserMapper {
    @Select("SELECT id, display_name, role, school_id, department_id, class_id FROM campus_user WHERE id = #{id}")
    CurrentUser findById(String id);

    @Select("SELECT id, display_name, role, school_id, department_id, class_id FROM campus_user")
    List<CurrentUser> findAll();

    @Select("SELECT course_id FROM user_course WHERE user_id = #{userId}")
    List<String> findCourseIdsByUserId(String userId);
}
