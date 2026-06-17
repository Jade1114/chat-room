package com.yuy.chatroom.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.yuy.chatroom.model.Channel;
import com.yuy.chatroom.model.ChannelType;
import com.yuy.chatroom.model.CurrentUser;
import com.yuy.chatroom.model.UserRole;

public class CampusDirectoryServiceTest {
    @Test
    void shouldReturnDefaultUserWhenUserIdMissing() {
        CampusDirectoryService service = new CampusDirectoryService();

        CurrentUser user = service.getCurrentUser(null);

        assertEquals("u-stu-1", user.getId());
        assertEquals("Yuy", user.getDisplayName());
        assertEquals(UserRole.STUDENT, user.getRole());
    }

    @Test
    void shouldReturnStudentAccessibleChannels() {
        CampusDirectoryService service = new CampusDirectoryService();

        List<Channel> channels = service.getAccessibleChannels("u-stu-1");

        assertTrue(containsChannel(channels, "ch-school"));
        assertTrue(containsChannel(channels, "ch-cs"));
        assertTrue(containsChannel(channels, "ch-cs-2401"));
        assertTrue(containsChannel(channels, "ch-java"));
        assertTrue(containsChannel(channels, "ch-websocket"));
        assertFalse(containsChannel(channels, "ch-cs-2402"));
        assertFalse(containsChannel(channels, "ch-linear-algebra"));
    }

    @Test
    void shouldReturnTeacherAccessibleChannels() {
        CampusDirectoryService service = new CampusDirectoryService();

        List<Channel> channels = service.getAccessibleChannels("u-teacher-1");

        assertTrue(containsChannel(channels, "ch-school"));
        assertTrue(containsChannel(channels, "ch-cs"));
        assertTrue(containsChannel(channels, "ch-java"));
        assertTrue(containsChannel(channels, "ch-websocket"));
        assertFalse(containsChannel(channels, "ch-cs-2401"));
    }

    @Test
    void shouldAllowAdminToAccessAllChannels() {
        CampusDirectoryService service = new CampusDirectoryService();

        List<Channel> channels = service.getAccessibleChannels("u-admin-1");

        assertEquals(9, channels.size());
        assertTrue(channels.stream().anyMatch(channel -> channel.getType() == ChannelType.COURSE));
        assertTrue(containsChannel(channels, "ch-linear-algebra"));
    }

    @Test
    void shouldHideInaccessibleChannelDetail() {
        CampusDirectoryService service = new CampusDirectoryService();

        assertTrue(service.getAccessibleChannelDetail("u-stu-1", "ch-java").isPresent());
        assertTrue(service.canAccess("u-stu-1", "ch-java"));
        assertFalse(service.getAccessibleChannelDetail("u-stu-1", "ch-linear-algebra").isPresent());
        assertFalse(service.canAccess("u-stu-1", "ch-linear-algebra"));
    }

    private boolean containsChannel(List<Channel> channels, String channelId) {
        return channels.stream().anyMatch(channel -> channel.getId().equals(channelId));
    }
}
