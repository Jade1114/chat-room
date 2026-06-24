package com.yuy.chatroom.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import com.yuy.chatroom.model.Channel;

@Mapper
public interface ChannelMapper {
    @Select("SELECT id, name, type, organization_id, description, is_readonly FROM organization_channel WHERE type = 'ORGANIZATION'")
    List<Channel> findAll();

    @Select("SELECT id, name, type, organization_id, description, is_readonly FROM organization_channel WHERE id = #{id} AND type = 'ORGANIZATION'")
    Channel findById(String id);

    @Select("""
        SELECT id, name, type, organization_id, description, is_readonly
        FROM organization_channel
        WHERE organization_id = #{organizationId}
          AND type = 'ORGANIZATION'
        ORDER BY id ASC
        """)
    List<Channel> findByOrganizationId(String organizationId);

    @Select("""
        SELECT id
        FROM organization_channel
        WHERE organization_id = #{organizationId}
          AND type = 'ORGANIZATION'
        ORDER BY id ASC
        LIMIT 1
        """)
    String findDefaultChannelId(String organizationId);

    @Insert("""
        INSERT INTO organization_channel (id, name, type, organization_id, description, is_readonly)
        VALUES (#{id}, #{name}, #{type}, #{organizationId}, #{description}, #{isReadonly})
        """)
    void insert(Channel channel);
}
