package com.yuy.chatroom.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.web.socket.WebSocketSession;

import com.yuy.chatroom.model.UserSessionInfo;

public class SessionManagerTest {
    @Test
    void shouldRejectDuplicateUsernameInSameRoom() {
        SessionManager sessionManager = new SessionManager();
        WebSocketSession session1 = mock(WebSocketSession.class);
        WebSocketSession session2 = mock(WebSocketSession.class);
        when(session1.getId()).thenReturn("s1");
        when(session2.getId()).thenReturn("s2");
        boolean first = sessionManager.tryRegister(session1, "yuy", "room1");
        boolean second = sessionManager.tryRegister(session2, "yuy", "room1");
        assertTrue(first);
        assertFalse(second);
    }

    @Test
    void shouldAllowSameUsernameInDifferentRooms() {
        SessionManager sessionManager = new SessionManager();
        WebSocketSession session1 = mock(WebSocketSession.class);
        WebSocketSession session2 = mock(WebSocketSession.class);
        when(session1.getId()).thenReturn("s1");
        when(session2.getId()).thenReturn("s2");
        boolean first = sessionManager.tryRegister(session1, "yuy", "room1");
        boolean second = sessionManager.tryRegister(session2, "yuy", "room2");
        assertTrue(first);
        assertTrue(second);
    }

    @Test
    void shouldRemoveSessionFromRoomWhenDisconnected() {
        SessionManager sessionManager = new SessionManager();
        WebSocketSession session = mock(WebSocketSession.class);
        when(session.getId()).thenReturn("s1");
        boolean registered = sessionManager.tryRegister(session, "yuy", "room1");
        UserSessionInfo removeInfo = sessionManager.removeSession(session);

        assertTrue(registered);
        assertNotNull(removeInfo);
        assertEquals("yuy", removeInfo.getUsername());
        assertEquals("room1", removeInfo.getRoomId());
        assertEquals(0, sessionManager.getSessionsByRoomId("room1").size());
    }
}
