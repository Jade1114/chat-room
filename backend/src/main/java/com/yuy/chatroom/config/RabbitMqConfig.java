package com.yuy.chatroom.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {
    private final String EXCHANGE_NAME = "exchange01";
    private final int BUCKET_COUNT = 4;

    @Bean
    public JacksonJsonMessageConverter rabbitMessageConverter() {
        return new JacksonJsonMessageConverter();
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
    RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
            JacksonJsonMessageConverter rabbitMessageConverter) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(rabbitMessageConverter);
        return rabbitTemplate;
    }

    @Bean
    SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(ConnectionFactory connectionFactory,
            JacksonJsonMessageConverter rabbitMessageConverter) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(rabbitMessageConverter);
        return factory;
    }
}
