package com.yuy.chatroom.service;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Service;

import com.rabbitmq.client.Channel;
import com.yuy.chatroom.config.RabbitMqConfig;
import com.yuy.chatroom.event.ActivityInterestCreatedEvent;

@Service
public class ActivityInterestEventConsumer {
  private final ActivityInterestNotificationPublisher notificationPublisher;
  private final ActivityHotScoreService hotScoreService;
  private final Logger log = LoggerFactory.getLogger(ActivityInterestEventConsumer.class);

  public ActivityInterestEventConsumer(ActivityInterestNotificationPublisher notificationPublisher,
      ActivityHotScoreService hotScoreService) {
    this.notificationPublisher = notificationPublisher;
    this.hotScoreService = hotScoreService;
  }

  @RabbitListener(
      queues = RabbitMqConfig.ACTIVITY_INTEREST_CREATED_QUEUE,
      containerFactory = "activityInterestRabbitListenerContainerFactory")
  public void consumeCreated(ActivityInterestCreatedEvent event, Channel channel,
      @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws IOException {
    try {
      if (!isValid(event)) {
        log.warn("Invalid ActivityInterestCreatedEvent, dead-lettering: event={}", event == null ? null : event.getEventId());
        channel.basicNack(deliveryTag, false, false);
        return;
      }

      notificationPublisher.publishHint(
          event.getActivityId(),
          event.getActivityTitle(),
          event.getInitiatorUserId(),
          event.getInitiatorLocalSessionId(),
          event.getInterestCount());
      hotScoreService.incrementInterestCreated(event.getActivityId(), event.getEventId());
      channel.basicAck(deliveryTag, false);
      log.info("Activity Interest event consumed: eventId={} activityId={}", event.getEventId(), event.getActivityId());
    } catch (Exception error) {
      log.warn("Activity Interest event consumer failed, dead-lettering: eventId={}",
          event == null ? null : event.getEventId(), error);
      channel.basicNack(deliveryTag, false, false);
    }
  }

  private boolean isValid(ActivityInterestCreatedEvent event) {
    if (event == null) {
      return false;
    }
    if (event.getEventId() == null || event.getEventId().isBlank()) {
      return false;
    }
    if (event.getActivityId() == null || event.getActivityId().isBlank()) {
      return false;
    }
    if (event.getInitiatorUserId() == null || event.getInitiatorUserId().isBlank()) {
      return event.getInitiatorLocalSessionId() != null && !event.getInitiatorLocalSessionId().isBlank();
    }
    return true;
  }
}
