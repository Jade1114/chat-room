package com.yuy.chatroom.mapper;

import java.time.Instant;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface ReadStateMapper {
  @Insert("""
      INSERT INTO user_channel_read_state (user_id, channel_id, last_read_at, updated_at)
      VALUES (#{userId}, #{channelId}, #{lastReadAt}, #{updatedAt})
      ON DUPLICATE KEY UPDATE
        last_read_at = VALUES(last_read_at),
        updated_at = VALUES(updated_at)
      """)
  void upsert(
      @Param("userId") String userId,
      @Param("channelId") String channelId,
      @Param("lastReadAt") Instant lastReadAt,
      @Param("updatedAt") Instant updatedAt);

  @Select("""
      SELECT last_read_at
      FROM user_channel_read_state
      WHERE user_id = #{userId}
        AND channel_id = #{channelId}
      """)
  Instant findLastReadAt(
      @Param("userId") String userId,
      @Param("channelId") String channelId);
}
