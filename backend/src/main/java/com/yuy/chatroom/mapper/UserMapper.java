package com.yuy.chatroom.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import com.yuy.chatroom.model.CurrentUser;

@Mapper
public interface UserMapper {
  @Select("SELECT id, display_name, role FROM app_user WHERE id = #{id}")
  CurrentUser findById(String id);

  @Select("SELECT id, display_name, role FROM app_user")
  List<CurrentUser> findAll();

  @Select("SELECT COUNT(*) FROM app_user")
  long countUsers();

  @Select("SELECT id, display_name, role FROM app_user WHERE username = #{username}")
  CurrentUser findByUsername(String username);

  @Select("SELECT id, display_name, role, password_hash FROM app_user WHERE username = #{username}")
  Map<String, Object> findAuthByUsername(String username);

  @Insert("INSERT INTO app_user (id, username, display_name, password_hash, role) " +
          "VALUES (#{id}, #{username}, #{displayName}, #{passwordHash}, #{role})")
  void insertUser(@Param("id") String id, @Param("username") String username,
                  @Param("displayName") String displayName, @Param("passwordHash") String passwordHash,
                  @Param("role") String role);
}
