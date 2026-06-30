package com.yuy.chatroom.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.core.AcknowledgeMode;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {
  private final String EXCHANGE_NAME = "exchange01";
  public static final String ACTIVITY_INTEREST_EXCHANGE = "activity.interest.exchange";
  public static final String ACTIVITY_INTEREST_CREATED_QUEUE = "activity.interest.created.queue";
  public static final String ACTIVITY_INTEREST_CREATED_DLQ = "activity.interest.created.dlq";
  public static final String ACTIVITY_INTEREST_DLX = "activity.interest.dlx";
  public static final String ACTIVITY_INTEREST_CREATED_ROUTING_KEY = "activity.interest.created";
  public static final String ACTIVITY_UPDATE_EXCHANGE = "activity.update.exchange";
  public static final String ACTIVITY_UPDATE_PUBLISHED_QUEUE = "activity.update.published.queue";
  public static final String ACTIVITY_UPDATE_PUBLISHED_DLQ = "activity.update.published.dlq";
  public static final String ACTIVITY_UPDATE_DLX = "activity.update.dlx";
  public static final String ACTIVITY_UPDATE_PUBLISHED_ROUTING_KEY = "activity.update.published";

  @Bean
  public Jackson2JsonMessageConverter rabbitMessageConverter() {
    return new Jackson2JsonMessageConverter();
  }

  private String buildBucketQueueName(int bucketIndex) {
    return "chat.queue." + Integer.toString(bucketIndex);
  }

  private String buildBucketRoutingKey(int bucketIndex) {
    return Integer.toString(bucketIndex);
  }

  @Bean
  TopicExchange chatExchange() {
    return new TopicExchange(EXCHANGE_NAME);
  }

  @Bean
  Queue bucketQueue0() {
    return new Queue(buildBucketQueueName(0));
  }

  @Bean
  Queue bucketQueue1() {
    return new Queue(buildBucketQueueName(1));
  }

  @Bean
  Queue bucketQueue2() {
    return new Queue(buildBucketQueueName(2));
  }

  @Bean
  Queue bucketQueue3() {
    return new Queue(buildBucketQueueName(3));
  }

  @Bean
  Binding bucketBinding0() {
    return BindingBuilder
        .bind(bucketQueue0())
        .to(chatExchange())
        .with(buildBucketRoutingKey(0));
  }

  @Bean
  Binding bucketBinding1() {
    return BindingBuilder
        .bind(bucketQueue1())
        .to(chatExchange())
        .with(buildBucketRoutingKey(1));
  }

  @Bean
  Binding bucketBinding2() {
    return BindingBuilder
        .bind(bucketQueue2())
        .to(chatExchange())
        .with(buildBucketRoutingKey(2));
  }

  @Bean
  Binding bucketBinding3() {
    return BindingBuilder
        .bind(bucketQueue3())
        .to(chatExchange())
        .with(buildBucketRoutingKey(3));
  }

  @Bean
  TopicExchange activityInterestExchange() {
    return new TopicExchange(ACTIVITY_INTEREST_EXCHANGE, true, false);
  }

  @Bean
  TopicExchange activityInterestDeadLetterExchange() {
    return new TopicExchange(ACTIVITY_INTEREST_DLX, true, false);
  }

  @Bean
  Queue activityInterestCreatedQueue() {
    return QueueBuilder.durable(ACTIVITY_INTEREST_CREATED_QUEUE)
        .withArgument("x-dead-letter-exchange", ACTIVITY_INTEREST_DLX)
        .withArgument("x-dead-letter-routing-key", ACTIVITY_INTEREST_CREATED_ROUTING_KEY)
        .build();
  }

  @Bean
  Queue activityInterestCreatedDeadLetterQueue() {
    return QueueBuilder.durable(ACTIVITY_INTEREST_CREATED_DLQ).build();
  }

  @Bean
  Binding activityInterestCreatedBinding() {
    return BindingBuilder
        .bind(activityInterestCreatedQueue())
        .to(activityInterestExchange())
        .with(ACTIVITY_INTEREST_CREATED_ROUTING_KEY);
  }

  @Bean
  Binding activityInterestCreatedDeadLetterBinding() {
    return BindingBuilder
        .bind(activityInterestCreatedDeadLetterQueue())
        .to(activityInterestDeadLetterExchange())
        .with(ACTIVITY_INTEREST_CREATED_ROUTING_KEY);
  }

  @Bean
  TopicExchange activityUpdateExchange() {
    return new TopicExchange(ACTIVITY_UPDATE_EXCHANGE, true, false);
  }

  @Bean
  TopicExchange activityUpdateDeadLetterExchange() {
    return new TopicExchange(ACTIVITY_UPDATE_DLX, true, false);
  }

  @Bean
  Queue activityUpdatePublishedQueue() {
    return QueueBuilder.durable(ACTIVITY_UPDATE_PUBLISHED_QUEUE)
        .withArgument("x-dead-letter-exchange", ACTIVITY_UPDATE_DLX)
        .withArgument("x-dead-letter-routing-key", ACTIVITY_UPDATE_PUBLISHED_ROUTING_KEY)
        .build();
  }

  @Bean
  Queue activityUpdatePublishedDeadLetterQueue() {
    return QueueBuilder.durable(ACTIVITY_UPDATE_PUBLISHED_DLQ).build();
  }

  @Bean
  Binding activityUpdatePublishedBinding() {
    return BindingBuilder
        .bind(activityUpdatePublishedQueue())
        .to(activityUpdateExchange())
        .with(ACTIVITY_UPDATE_PUBLISHED_ROUTING_KEY);
  }

  @Bean
  Binding activityUpdatePublishedDeadLetterBinding() {
    return BindingBuilder
        .bind(activityUpdatePublishedDeadLetterQueue())
        .to(activityUpdateDeadLetterExchange())
        .with(ACTIVITY_UPDATE_PUBLISHED_ROUTING_KEY);
  }

  @Bean
  RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
      Jackson2JsonMessageConverter rabbitMessageConverter) {
    RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
    rabbitTemplate.setMessageConverter(rabbitMessageConverter);
    return rabbitTemplate;
  }

  @Bean
  SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(ConnectionFactory connectionFactory,
      Jackson2JsonMessageConverter rabbitMessageConverter) {
    SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
    factory.setConnectionFactory(connectionFactory);
    factory.setMessageConverter(rabbitMessageConverter);
    return factory;
  }

  @Bean
  SimpleRabbitListenerContainerFactory activityInterestRabbitListenerContainerFactory(ConnectionFactory connectionFactory,
      Jackson2JsonMessageConverter rabbitMessageConverter) {
    SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
    factory.setConnectionFactory(connectionFactory);
    factory.setMessageConverter(rabbitMessageConverter);
    factory.setAcknowledgeMode(AcknowledgeMode.MANUAL);
    factory.setDefaultRequeueRejected(false);
    return factory;
  }
}
