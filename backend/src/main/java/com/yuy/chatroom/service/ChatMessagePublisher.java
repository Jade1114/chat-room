package com.yuy.chatroom.service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import com.yuy.chatroom.model.Message;

@Service
public class ChatMessagePublisher {

    private final RabbitTemplate rabbitTemplate;

    private final String EXCHANGE_NAME = "exchange01";

    private final int BUCKET_COUNT = 4;

    private final Set<Integer> declaredBuckets = ConcurrentHashMap.newKeySet();

    private final Logger log = LoggerFactory.getLogger(ChatMessagePublisher.class);

    public ChatMessagePublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public boolean publishMessage(Message message) {
        if (message == null) {
            return false;
        }

        String channelId = message.getChannelId();
        if (channelId == null) {
            return false;
        }

        int bucketIndex = resolveBucketIndex(channelId);

        if (!declaredBuckets.contains(bucketIndex)) {
            if (!declareBucketResources(bucketIndex)) {
                return false;
            }
            declaredBuckets.add(bucketIndex);
        }

        String key = buildBucketRoutingKey(bucketIndex);

        try {
            rabbitTemplate.convertAndSend(EXCHANGE_NAME, key, message);
            log.info("RabbitMQ 发布成功 channelId={} bucketIndex={} message={}", channelId, bucketIndex, message);
        } catch (AmqpException e) {
            log.warn("RabbitMQ 发布失败 channelId={} bucketIndex={} message={}", channelId, bucketIndex, message);
            return false;
        }

        return true;
    }

    private boolean declareBucketResources(int bucketIndex) {
        return true;
    }

    private int resolveBucketIndex(String channelId) {
        return Math.abs(channelId.hashCode()) % BUCKET_COUNT;
    }

    private String buildBucketRoutingKey(int bucketIndex) {
        return Integer.toString(bucketIndex);
    }

}
