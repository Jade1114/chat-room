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
import com.yuy.chatroom.event.ActivityUpdatePublishedEvent;
import com.yuy.chatroom.model.Activity;
import com.yuy.chatroom.model.ActivityUpdate;

@Service
public class ActivityUpdateEventPublisher {
  private final RabbitTemplate rabbitTemplate;
  private final Logger log = LoggerFactory.getLogger(ActivityUpdateEventPublisher.class);

  public ActivityUpdateEventPublisher(RabbitTemplate rabbitTemplate) {
    this.rabbitTemplate = rabbitTemplate;
  }

  public boolean publish(Activity activity, ActivityUpdate update) {
    if (activity == null || update == null) {
      return false;
    }
    String eventId = "aup-" + UUID.randomUUID().toString().substring(0, 12);
    ActivityUpdatePublishedEvent event = new ActivityUpdatePublishedEvent(
        eventId,
        activity.getId(),
        activity.getTitle(),
        update.getId(),
        update.getAuthorUserId(),
        update.getAuthorLocalSessionId(),
        Instant.now());
    try {
      rabbitTemplate.convertAndSend(
          RabbitMqConfig.ACTIVITY_UPDATE_EXCHANGE,
          RabbitMqConfig.ACTIVITY_UPDATE_PUBLISHED_ROUTING_KEY,
          event,
          new CorrelationData(eventId));
      log.info("Activity Update event published: eventId={} activityId={} updateId={}",
          eventId, activity.getId(), update.getId());
      return true;
    } catch (AmqpException error) {
      log.warn("Activity Update event publish failed: eventId={} activityId={} updateId={}",
          eventId, activity.getId(), update.getId(), error);
      return false;
    }
  }
}
