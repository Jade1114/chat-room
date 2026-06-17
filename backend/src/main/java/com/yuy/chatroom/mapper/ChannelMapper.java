package com.yuy.chatroom.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import com.yuy.chatroom.model.Channel;

@Mapper
public interface ChannelMapper {
    @Select("SELECT id, name, type, scope_id, description, is_readonly FROM campus_channel")
    List<Channel> findAll();

    @Select("SELECT id, name, type, scope_id, description, is_readonly FROM campus_channel WHERE id = #{id}")
    Channel findById(String id);
}
