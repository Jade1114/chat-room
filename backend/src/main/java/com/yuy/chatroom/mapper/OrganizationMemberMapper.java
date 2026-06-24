package com.yuy.chatroom.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import com.yuy.chatroom.model.MemberPreview;

@Mapper
public interface OrganizationMemberMapper {
  @Select("""
      SELECT COUNT(1)
      FROM organization_member
      WHERE user_id = #{userId}
        AND organization_id = #{organizationId}
      """)
  int countMembership(@Param("userId") String userId, @Param("organizationId") String organizationId);

  @Select("""
      SELECT COUNT(1)
      FROM organization_member
      WHERE organization_id = #{organizationId}
      """)
  long countMembers(String organizationId);

  @Insert("""
      INSERT IGNORE INTO organization_member (organization_id, user_id, role, joined_at)
      VALUES (#{organizationId}, #{userId}, #{role}, NOW(3))
      """)
  void insertMembership(@Param("organizationId") String organizationId,
                        @Param("userId") String userId,
                        @Param("role") String role);

  @Select("""
      SELECT om.user_id AS id, u.display_name AS displayName, om.role
      FROM organization_member om
      JOIN app_user u ON u.id = om.user_id
      WHERE om.organization_id = #{organizationId}
      ORDER BY om.joined_at ASC
      """)
  List<MemberPreview> findMembersByOrganizationId(String organizationId);
}
