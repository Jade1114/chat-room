package com.yuy.chatroom.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface OrganizationMemberMapper {
  @Select("""
      SELECT COUNT(1)
      FROM organization_member
      WHERE user_id = #{userId}
        AND organization_id = #{organizationId}
      """)
  int countMembership(@Param("userId") String userId, @Param("organizationId") String organizationId);

  @Insert("""
      INSERT IGNORE INTO organization_member (organization_id, user_id, role, joined_at)
      VALUES (#{organizationId}, #{userId}, #{role}, NOW(3))
      """)
  void insertMembership(@Param("organizationId") String organizationId,
                        @Param("userId") String userId,
                        @Param("role") String role);
}
