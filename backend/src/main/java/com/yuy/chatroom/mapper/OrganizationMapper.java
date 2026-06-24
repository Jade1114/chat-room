package com.yuy.chatroom.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import com.yuy.chatroom.model.Organization;

@Mapper
public interface OrganizationMapper {
  @Select("SELECT id, name, description, visibility, join_policy, created_by, created_at FROM organization WHERE id = #{id}")
  Organization findById(String id);

  @Select("SELECT id, name, description, visibility, join_policy, created_by, created_at FROM organization ORDER BY created_at ASC, id ASC")
  List<Organization> findAll();

  @Insert("""
      INSERT INTO organization (id, name, description, visibility, join_policy, created_by, created_at)
      VALUES (#{id}, #{name}, #{description}, #{visibility}, #{joinPolicy}, #{createdBy}, #{createdAt})
      """)
  void insert(Organization organization);

  @Select("SELECT tag FROM organization_tag WHERE organization_id = #{organizationId} ORDER BY tag ASC")
  List<String> findTagsByOrganizationId(String organizationId);
}
