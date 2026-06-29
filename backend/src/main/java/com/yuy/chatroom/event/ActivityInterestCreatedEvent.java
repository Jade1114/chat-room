package com.yuy.chatroom.event;

import java.time.Instant;

public class ActivityInterestCreatedEvent {
  private String eventId;
  private String activityId;
  private String activityTitle;
  private String initiatorUserId;
  private String initiatorLocalSessionId;
  private long interestCount;
  private Instant occurredAt;

  public ActivityInterestCreatedEvent() {
  }

  public ActivityInterestCreatedEvent(String eventId, String activityId, String activityTitle,
      String initiatorUserId, String initiatorLocalSessionId, long interestCount, Instant occurredAt) {
    this.eventId = eventId;
    this.activityId = activityId;
    this.activityTitle = activityTitle;
    this.initiatorUserId = initiatorUserId;
    this.initiatorLocalSessionId = initiatorLocalSessionId;
    this.interestCount = interestCount;
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

  public String getInitiatorUserId() {
    return initiatorUserId;
  }

  public void setInitiatorUserId(String initiatorUserId) {
    this.initiatorUserId = initiatorUserId;
  }

  public String getInitiatorLocalSessionId() {
    return initiatorLocalSessionId;
  }

  public void setInitiatorLocalSessionId(String initiatorLocalSessionId) {
    this.initiatorLocalSessionId = initiatorLocalSessionId;
  }

  public long getInterestCount() {
    return interestCount;
  }

  public void setInterestCount(long interestCount) {
    this.interestCount = interestCount;
  }

  public Instant getOccurredAt() {
    return occurredAt;
  }

  public void setOccurredAt(Instant occurredAt) {
    this.occurredAt = occurredAt;
  }
}
