package com.yuy.chatroom.model;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Message {
  private MessageType type;
  private String userId;
  private String displayName;
  private String content;
  private String channelId;
  private String messageId;
  private Instant sentAt;

  public Message(MessageType type, String displayName, String content, String channelId) {
    this(type, null, displayName, content, channelId);
  }

  public Message(MessageType type, String userId, String displayName, String content, String channelId) {
    this.type = type;
    this.userId = userId;
    this.displayName = displayName;
    this.content = content;
    this.channelId = channelId;
  }
}
