package com.yuy.chatroom.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.web.socket.WebSocketSession;

import com.yuy.chatroom.model.Message;
import com.yuy.chatroom.model.MessageType;

public class MessageProcessorTest {

    @Test
    void shouldRejectChatMessageWhenSessionNotRegistered() {
        SessionManager sessionManager = mock(SessionManager.class);
        BroadcastDispatcher broadcastDispatcher = mock(BroadcastDispatcher.class);
        WebSocketSession session = mock(WebSocketSession.class);

        MessageProcessor processor = new MessageProcessor(sessionManager, broadcastDispatcher);
        Message message = new Message(MessageType.USER_CHAT, "fake", "hello", "room1");

        when(sessionManager.getSessionInfo(session)).thenReturn(null);

        processor.processMessage(session, message);

        verify(broadcastDispatcher, never()).submit(any());
    }

    @Test
    void shouldSubmitJoinMessageWhenRegistrationSucceeds() {
        SessionManager sessionManager = mock(SessionManager.class);
        BroadcastDispatcher broadcastDispatcher = mock(BroadcastDispatcher.class);
        WebSocketSession session = mock(WebSocketSession.class);

        MessageProcessor processor = new MessageProcessor(sessionManager, broadcastDispatcher);
        Message message = new Message(MessageType.USER_JOIN, "yuy", "进入了当前频道", "room1");

        when(sessionManager.tryRegister(session, "yuy", "room1")).thenReturn(true);

        processor.processMessage(session, message);

        verify(broadcastDispatcher).submit(message);
    }

    @Test
    void shouldNotSubmitJoinMessageWhenRegistrationFails() {
        SessionManager sessionManager = mock(SessionManager.class);
        BroadcastDispatcher broadcastDispatcher = mock(BroadcastDispatcher.class);
        WebSocketSession session = mock(WebSocketSession.class);

        MessageProcessor processor = new MessageProcessor(sessionManager, broadcastDispatcher);
        Message message = new Message(MessageType.USER_JOIN, "yuy", "进入了当前频道", "room1");

        when(sessionManager.tryRegister(session, "yuy", "room1")).thenReturn(false);

        processor.processMessage(session, message);

        verify(broadcastDispatcher, never()).submit(any());
    }

}
