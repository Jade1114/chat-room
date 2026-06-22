package com.yuy.chatroom.service;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.yuy.chatroom.model.Message;

import jakarta.annotation.PreDestroy;

@Service
public class BroadcastDispatcher {
  private final ConcurrentHashMap<String, AtomicBoolean> channelHandlingFlags = new ConcurrentHashMap<>();
  private final ConcurrentHashMap<String, BlockingQueue<Message>> channelQueues = new ConcurrentHashMap<>();
  private final ExecutorService threadPool = Executors.newFixedThreadPool(4);

  private static final Logger log = LoggerFactory.getLogger(BroadcastDispatcher.class);

  private final SessionManager sessionManager;
  private final BroadcastService broadcastService;

  public BroadcastDispatcher(SessionManager sessionManager, BroadcastService broadcastService) {
    this.sessionManager = sessionManager;
    this.broadcastService = broadcastService;
  }

  public void submit(Message message) {
    String channelId = message.getChannelId();
    AtomicBoolean flag = channelHandlingFlags.computeIfAbsent(channelId, key -> new AtomicBoolean(false));
    BlockingQueue<Message> queue = channelQueues.computeIfAbsent(channelId, key -> new ArrayBlockingQueue<Message>(10));

    try {
      queue.put(message);

      if (flag.compareAndSet(false, true)) {
        log.info("{} 当前频道中不存在消费线程，尝试向线程池申请线程", channelId);
        threadPool.submit(() -> processChannelQueue(channelId));
      } else {
        log.info("{} 频道中已经存在消费线程，submit任务完成", channelId);
      }

    } catch (InterruptedException e) {
      log.warn("尝试给 {} 频道消息队列添加消息时，线程被中断", channelId);
      Thread.currentThread().interrupt();
    }
  }

  private void processChannelQueue(String channelId) {
    BlockingQueue<Message> queue = channelQueues.get(channelId);
    AtomicBoolean flag = channelHandlingFlags.get(channelId);

    if (queue == null || flag == null) {
      return;
    }

    while (true) {
      Message message = queue.poll();

      if (message == null) {
        flag.compareAndSet(true, false);
        if (queue.isEmpty()) {
          log.info("{} 频道消息队列已处理完，释放处理权", channelId);
          return;
        }
        if (flag.compareAndSet(false, true)) {
          continue;
        }
        return;
      }

      try {
        sessionManager.removeSessions(
            broadcastService.broadcastMessage(message, sessionManager.getSessionsByChannelId(channelId)));
      } catch (Exception e) {
        log.error("{} 频道消息广播失败", channelId, e);
      }
    }
  }

  @PreDestroy
  public void stop() {
    threadPool.shutdownNow();
  }

}
