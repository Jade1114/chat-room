package com.yuy.chatroom.service;

import java.time.Instant;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import com.yuy.chatroom.config.RabbitMqConfig;
import com.yuy.chatroom.event.ActivityInterestCreatedEvent;
import com.yuy.chatroom.model.Activity;

@Service
public class ActivityInterestEventPublisher {
  private final RabbitTemplate rabbitTemplate;
  private final Logger log = LoggerFactory.getLogger(ActivityInterestEventPublisher.class);

  public ActivityInterestEventPublisher(RabbitTemplate rabbitTemplate) {
    this.rabbitTemplate = rabbitTemplate;
    this.rabbitTemplate.setConfirmCallback((correlationData, ack, cause) -> {
      String eventId = correlationData == null ? "unknown" : correlationData.getId();
      if (ack) {
        log.info("Activity Interest event broker confirmed: eventId={}", eventId);
      } else {
        log.warn("Activity Interest event broker rejected: eventId={} cause={}", eventId, cause);
      }
    });
  }

  public boolean publishCreated(Activity activity, long interestCount) {
    if (activity == null) {
      return false;
    }

    String eventId = "aie-" + UUID.randomUUID().toString().substring(0, 12);
    ActivityInterestCreatedEvent event = new ActivityInterestCreatedEvent(
        eventId,
        activity.getId(),
        activity.getTitle(),
        activity.getCreatedByUserId(),
        activity.getCreatedByLocalSessionId(),
        interestCount,
        Instant.now());

    try {
      rabbitTemplate.convertAndSend(
          RabbitMqConfig.ACTIVITY_INTEREST_EXCHANGE,
          RabbitMqConfig.ACTIVITY_INTEREST_CREATED_ROUTING_KEY,
          event,
          new CorrelationData(eventId));
      log.info("Activity Interest event published: eventId={} activityId={} interestCount={}",
          eventId, activity.getId(), interestCount);
      return true;
    } catch (AmqpException error) {
      log.warn("Activity Interest event publish failed: eventId={} activityId={}", eventId, activity.getId(), error);
      return false;
    }
  }
}
