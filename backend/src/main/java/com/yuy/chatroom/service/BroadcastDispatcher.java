package com.yuy.chatroom.service;

import java.io.IOException;
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
                removeExceptionSessions(broadcastService.broadcastMessage(message, sessionManager.getSessions()));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("错误：消费线程被中断，准备停止");
                break;
            } catch (IOException e) {
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
