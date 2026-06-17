package com.yuy.chatroom.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.yuy.chatroom.model.Channel;
import com.yuy.chatroom.model.ChannelDetail;
import com.yuy.chatroom.model.ChannelType;
import com.yuy.chatroom.model.CurrentUser;
import com.yuy.chatroom.model.UserRole;

public class CampusDirectoryServiceTest {
    private ChannelPresenceService presenceService;
    private CampusDirectoryService service;

    @BeforeEach
    void setUp() {
        presenceService = new ChannelPresenceService();
        service = new CampusDirectoryService(presenceService);
    }

    @Test
    void shouldReturnDefaultUserWhenUserIdMissing() {
        CurrentUser user = service.getCurrentUser(null);

        assertEquals("u-stu-1", user.getId());
        assertEquals("Yuy", user.getDisplayName());
        assertEquals(UserRole.STUDENT, user.getRole());
    }

    @Test
    void shouldReturnStudentAccessibleChannels() {
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
        List<Channel> channels = service.getAccessibleChannels("u-teacher-1");

        assertTrue(containsChannel(channels, "ch-school"));
        assertTrue(containsChannel(channels, "ch-cs"));
        assertTrue(containsChannel(channels, "ch-java"));
        assertTrue(containsChannel(channels, "ch-websocket"));
        assertFalse(containsChannel(channels, "ch-cs-2401"));
    }

    @Test
    void shouldAllowAdminToAccessAllChannels() {
        List<Channel> channels = service.getAccessibleChannels("u-admin-1");

        assertEquals(9, channels.size());
        assertTrue(channels.stream().anyMatch(channel -> channel.getType() == ChannelType.COURSE));
        assertTrue(containsChannel(channels, "ch-linear-algebra"));
    }

    @Test
    void shouldHideInaccessibleChannelDetail() {
        assertTrue(service.getAccessibleChannelDetail("u-stu-1", "ch-java").isPresent());
        assertTrue(service.canAccess("u-stu-1", "ch-java"));
        assertFalse(service.getAccessibleChannelDetail("u-stu-1", "ch-linear-algebra").isPresent());
        assertFalse(service.canAccess("u-stu-1", "ch-linear-algebra"));
    }

    @Test
    void shouldReflectOnlinePresenceInChannelDetail() {
        presenceService.join("ch-java", "u-stu-1");
        presenceService.join("ch-java", "u-teacher-1");
        presenceService.join("ch-java", "u-stu-2");

        Optional<ChannelDetail> detail = service.getAccessibleChannelDetail("u-stu-1", "ch-java");

        assertTrue(detail.isPresent());
        assertEquals(3, detail.get().getOnlineCount());
        assertTrue(detail.get().getOnlineUsers().contains("Yuy"));
        assertTrue(detail.get().getOnlineUsers().contains("Chen"));
        assertTrue(detail.get().getOnlineUsers().contains("Mina"));
    }

    @Test
    void shouldReturnZeroOnlineWhenNoUsersJoined() {
        Optional<ChannelDetail> detail = service.getAccessibleChannelDetail("u-stu-1", "ch-java");

        assertTrue(detail.isPresent());
        assertEquals(0, detail.get().getOnlineCount());
        assertTrue(detail.get().getOnlineUsers().isEmpty());
    }

    private boolean containsChannel(List<Channel> channels, String channelId) {
        return channels.stream().anyMatch(channel -> channel.getId().equals(channelId));
    }
}
