package com.yuy.chatroom.event;

import java.time.Instant;

public class ActivityUpdatePublishedEvent {
  private String eventId;
  private String activityId;
  private String activityTitle;
  private String updateId;
  private String authorUserId;
  private String authorLocalSessionId;
  private Instant occurredAt;

  public ActivityUpdatePublishedEvent() {
  }

  public ActivityUpdatePublishedEvent(String eventId, String activityId, String activityTitle,
      String updateId, String authorUserId, String authorLocalSessionId, Instant occurredAt) {
    this.eventId = eventId;
    this.activityId = activityId;
    this.activityTitle = activityTitle;
    this.updateId = updateId;
    this.authorUserId = authorUserId;
    this.authorLocalSessionId = authorLocalSessionId;
    this.occurredAt = occurredAt;
  }

  public String getEventId() {
    return eventId;
  }

  public void setEventId(String eventId) {
    this.eventId = eventId;
  }

  public String getActivityId() {
    return activityId;
  }

  public void setActivityId(String activityId) {
    this.activityId = activityId;
  }

  public String getActivityTitle() {
    return activityTitle;
  }

  public void setActivityTitle(String activityTitle) {
    this.activityTitle = activityTitle;
  }

  public String getUpdateId() {
    return updateId;
  }

  public void setUpdateId(String updateId) {
    this.updateId = updateId;
  }

  public String getAuthorUserId() {
    return authorUserId;
  }

  public void setAuthorUserId(String authorUserId) {
    this.authorUserId = authorUserId;
  }

  public String getAuthorLocalSessionId() {
    return authorLocalSessionId;
  }

  public void setAuthorLocalSessionId(String authorLocalSessionId) {
    this.authorLocalSessionId = authorLocalSessionId;
  }

  public Instant getOccurredAt() {
    return occurredAt;
  }

  public void setOccurredAt(Instant occurredAt) {
    this.occurredAt = occurredAt;
  }
}
