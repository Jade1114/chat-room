package com.yuy.chatroom.service;

import java.io.IOException;
import java.util.LinkedHashSet;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Service;

import com.rabbitmq.client.Channel;
import com.yuy.chatroom.config.RabbitMqConfig;
import com.yuy.chatroom.event.ActivityUpdatePublishedEvent;
import com.yuy.chatroom.mapper.ActivityUpdateMapper;

@Service
public class ActivityUpdateEventConsumer {
  private final ActivityUpdateMapper updateMapper;
  private final ActivityUpdateNotificationPublisher notificationPublisher;
  private final Logger log = LoggerFactory.getLogger(ActivityUpdateEventConsumer.class);

  public ActivityUpdateEventConsumer(ActivityUpdateMapper updateMapper,
      ActivityUpdateNotificationPublisher notificationPublisher) {
    this.updateMapper = updateMapper;
    this.notificationPublisher = notificationPublisher;
  }

  @RabbitListener(
      queues = RabbitMqConfig.ACTIVITY_UPDATE_PUBLISHED_QUEUE,
      containerFactory = "activityInterestRabbitListenerContainerFactory")
  public void consumePublished(ActivityUpdatePublishedEvent event, Channel channel,
      @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws IOException {
    try {
      if (!isValid(event)) {
        log.warn("Invalid ActivityUpdatePublishedEvent, dead-lettering: event={}", event == null ? null : event.getEventId());
        channel.basicNack(deliveryTag, false, false);
        return;
      }
      Set<String> userIds = new LinkedHashSet<>(updateMapper.findInterestedUserIds(event.getActivityId()));
      Set<String> localSessionIds = new LinkedHashSet<>(updateMapper.findInterestedLocalSessionIds(event.getActivityId()));
      userIds.removeIf(userId -> userId == null || userId.isBlank() || userId.equals(event.getAuthorUserId()));
      localSessionIds.removeIf(localSessionId -> localSessionId == null || localSessionId.isBlank()
          || localSessionId.equals(event.getAuthorLocalSessionId()));
      notificationPublisher.publishToInterestedIdentities(
          event.getActivityId(),
          event.getActivityTitle(),
          event.getUpdateId(),
          userIds,
          localSessionIds);
      channel.basicAck(deliveryTag, false);
      log.info("Activity Update event consumed: eventId={} activityId={} updateId={} recipients={}",
          event.getEventId(), event.getActivityId(), event.getUpdateId(), userIds.size() + localSessionIds.size());
    } catch (Exception error) {
      log.warn("Activity Update event consumer failed, dead-lettering: eventId={}",
          event == null ? null : event.getEventId(), error);
      channel.basicNack(deliveryTag, false, false);
    }
  }

  private boolean isValid(ActivityUpdatePublishedEvent event) {
    return event != null
        && event.getEventId() != null && !event.getEventId().isBlank()
        && event.getActivityId() != null && !event.getActivityId().isBlank()
        && event.getUpdateId() != null && !event.getUpdateId().isBlank();
  }
}
