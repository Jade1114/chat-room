package com.yuy.chatroom.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import com.yuy.chatroom.model.Channel;

@Mapper
public interface ChannelMapper {
    @Select("SELECT id, name, type, organization_id, description, is_readonly FROM organization_channel WHERE type = 'ORGANIZATION'")
    List<Channel> findAll();

    @Select("SELECT id, name, type, organization_id, description, is_readonly FROM organization_channel WHERE id = #{id} AND type = 'ORGANIZATION'")
    Channel findById(String id);
}
