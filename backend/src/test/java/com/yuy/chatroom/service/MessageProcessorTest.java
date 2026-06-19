package com.yuy.chatroom.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.web.socket.WebSocketSession;

import com.yuy.chatroom.model.Message;
import com.yuy.chatroom.model.MessageType;
import com.yuy.chatroom.model.UserSessionInfo;

public class MessageProcessorTest {

    @Test
    void shouldAttachServerMetadataAndAckWhenChatMessagePublished() {
        SessionManager sessionManager = mock(SessionManager.class);
        BroadcastDispatcher broadcastDispatcher = mock(BroadcastDispatcher.class);
        BroadcastService broadcastService = mock(BroadcastService.class);
        ChannelPresenceService channelPresenceService = mock(ChannelPresenceService.class);
        ChatMessagePublisher chatMessagePublisher = mock(ChatMessagePublisher.class);
        WebSocketSession session = mock(WebSocketSession.class);
        Message message = new Message(MessageType.USER_CHAT, "client", "hello", "client-room");

        when(sessionManager.getSessionInfo(session)).thenReturn(new UserSessionInfo("yuy", "room1"));
        when(chatMessagePublisher.publishMessage(message)).thenReturn(true);
        when(broadcastService.sendMessage(eq(session), any(Message.class))).thenReturn(true);

        MessageProcessor processor = new MessageProcessor(sessionManager, broadcastDispatcher, broadcastService,
                channelPresenceService, chatMessagePublisher);
        processor.processMessage(session, message);

        ArgumentCaptor<Message> ackCaptor = ArgumentCaptor.forClass(Message.class);
        verify(chatMessagePublisher).publishMessage(message);
        verify(broadcastService).sendMessage(eq(session), ackCaptor.capture());

        Message ack = ackCaptor.getValue();
        assertEquals("yuy", message.getSender());
        assertEquals("room1", message.getRoomId());
        assertNotNull(message.getMessageId());
        assertNotNull(message.getSentAt());
        assertEquals(MessageType.MESSAGE_ACK, ack.getType());
        assertEquals("ACCEPTED", ack.getContent());
        assertEquals(message.getMessageId(), ack.getMessageId());
        assertEquals(message.getSentAt(), ack.getSentAt());
    }

    @Test
    void shouldNotPublishInvalidChatMessage() {
        SessionManager sessionManager = mock(SessionManager.class);
        BroadcastDispatcher broadcastDispatcher = mock(BroadcastDispatcher.class);
        BroadcastService broadcastService = mock(BroadcastService.class);
        ChannelPresenceService channelPresenceService = mock(ChannelPresenceService.class);
        ChatMessagePublisher chatMessagePublisher = mock(ChatMessagePublisher.class);
        WebSocketSession session = mock(WebSocketSession.class);
        Message message = new Message(MessageType.USER_CHAT, "client", " ", "room1");

        MessageProcessor processor = new MessageProcessor(sessionManager, broadcastDispatcher, broadcastService,
                channelPresenceService, chatMessagePublisher);
        processor.processMessage(session, message);

        verify(chatMessagePublisher, never()).publishMessage(any());
        verify(broadcastService, never()).sendMessage(any(), any());
    }
}
