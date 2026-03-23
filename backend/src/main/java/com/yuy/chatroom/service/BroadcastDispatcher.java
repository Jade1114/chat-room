package com.yuy.chatroom.service;

import java.util.Set;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import com.yuy.chatroom.model.Message;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import tools.jackson.core.JacksonException;

@Service
public class BroadcastDispatcher {
    private final BlockingQueue<Message> queue = new LinkedBlockingQueue<>();
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private static final Logger log = LoggerFactory.getLogger(BroadcastDispatcher.class);
    private boolean isRunning = true;

    private final SessionManager sessionManager;
    private final BroadcastService broadcastService;

    public BroadcastDispatcher(SessionManager sessionManager, BroadcastService broadcastService) {
        this.sessionManager = sessionManager;
        this.broadcastService = broadcastService;
    }

    public void submit(Message message) {
        try {
            queue.put(message);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("错误：无法成功添加消息到队列中，当前线程被中断");
            return;
        }
    }

    @PostConstruct
    public void start() {
        executor.execute(() -> {
            dispatchLoop();
        });
    }

    private void dispatchLoop() {
        while (isRunning) {
            try {
                Message message = queue.take();
                if (message.getRoomId() == null) {
                    log.warn("错误：消息缺少房间信息，无法广播");
                    continue;
                }
                removeExceptionSessions(broadcastService.broadcastMessage(message,
                        sessionManager.getSessionsByRoomId(message.getRoomId())));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("错误：消费线程被中断，准备停止");
                break;
            } catch (JacksonException e) {
                log.error("错误：消息无法广播");
            }
            // 循环取消息
            // 拿当前在线 sessions
            // 调 broadcastService 广播
            // 清理异常 session
        }
    }

    @PreDestroy
    public void stop() {
        isRunning = false;
        executor.shutdownNow();
        // 关闭执行器
    }

    private void removeExceptionSessions(Set<WebSocketSession> exceptionSessions) {
        sessionManager.removeSessions(exceptionSessions);
    }

}
