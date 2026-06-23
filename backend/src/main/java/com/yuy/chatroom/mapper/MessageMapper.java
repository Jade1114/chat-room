package com.yuy.chatroom.mapper;

import java.time.Instant;
import java.util.List;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import com.yuy.chatroom.model.Message;

@Mapper
public interface MessageMapper {
  @Insert("""
      INSERT INTO chat_message (message_id, channel_id, user_id, display_name, content, type, sent_at)
      VALUES (#{messageId}, #{channelId}, #{userId}, #{displayName}, #{content}, #{type}, #{sentAt})
      """)
  void insert(Message message);

  @Select("""
      SELECT type, user_id, display_name, content, channel_id, message_id, sent_at
      FROM chat_message
      WHERE channel_id = #{channelId}
      ORDER BY sent_at DESC, message_id DESC
      LIMIT #{limit}
      """)
  List<Message> findRecentByChannelId(@Param("channelId") String channelId, @Param("limit") int limit);

  @Select("""
      SELECT type, user_id, display_name, content, channel_id, message_id, sent_at
      FROM chat_message
      WHERE channel_id = #{channelId}
        AND sent_at < #{before}
      ORDER BY sent_at DESC, message_id DESC
      LIMIT #{limit}
      """)
  List<Message> findBeforeByChannelId(
      @Param("channelId") String channelId,
      @Param("before") Instant before,
      @Param("limit") int limit);
}
