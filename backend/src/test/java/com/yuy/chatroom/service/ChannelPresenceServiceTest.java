package com.yuy.chatroom.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class ChannelPresenceServiceTest {
    private ChannelPresenceService service;

    @BeforeEach
    void setUp() {
        service = new ChannelPresenceService();
    }

    @Test
    void shouldReturnZeroForUnknownChannel() {
        assertEquals(0, service.getOnlineCount("ch-unknown"));
        assertTrue(service.getOnlineUserIds("ch-unknown").isEmpty());
    }

    @Test
    void shouldTrackJoinAndLeave() {
        service.join("ch-java", "u-stu-1");
        service.join("ch-java", "u-teacher-1");

        assertEquals(2, service.getOnlineCount("ch-java"));
        assertEquals(2, service.getOnlineUserIds("ch-java").size());
        assertTrue(service.getOnlineUserIds("ch-java").contains("u-stu-1"));
        assertTrue(service.getOnlineUserIds("ch-java").contains("u-teacher-1"));

        service.leave("ch-java", "u-stu-1");

        assertEquals(1, service.getOnlineCount("ch-java"));
        assertTrue(service.getOnlineUserIds("ch-java").contains("u-teacher-1"));
    }

    @Test
    void shouldBeIdempotentForJoin() {
        service.join("ch-java", "u-stu-1");
        service.join("ch-java", "u-stu-1");
        service.join("ch-java", "u-stu-1");

        assertEquals(1, service.getOnlineCount("ch-java"));
    }

    @Test
    void shouldNotFailOnLeaveForUnknownUser() {
        service.leave("ch-java", "u-stu-1");
        assertEquals(0, service.getOnlineCount("ch-java"));
    }

    @Test
    void shouldRemoveUserFromAllChannels() {
        service.join("ch-java", "u-stu-1");
        service.join("ch-websocket", "u-stu-1");
        service.join("ch-school", "u-teacher-1");

        service.leaveAllChannels("u-stu-1");

        assertEquals(0, service.getOnlineCount("ch-java"));
        assertEquals(0, service.getOnlineCount("ch-websocket"));
        assertEquals(1, service.getOnlineCount("ch-school"));
    }

    @Test
    void shouldTrackMultipleChannelsIndependently() {
        service.join("ch-java", "u-stu-1");
        service.join("ch-websocket", "u-stu-1");
        service.join("ch-websocket", "u-teacher-1");

        assertEquals(1, service.getOnlineCount("ch-java"));
        assertEquals(2, service.getOnlineCount("ch-websocket"));
    }
}
