package com.yuy.chatroom.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.SetOperations;

@ExtendWith(MockitoExtension.class)
public class ChannelPresenceServiceTest {
    @Mock
    private RedisTemplate<String, String> redisTemplate;

    @Mock
    private SetOperations<String, String> setOperations;

    private ChannelPresenceService service;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForSet()).thenReturn(setOperations);
        service = new ChannelPresenceService(redisTemplate);
    }

    @Test
    void shouldReturnZeroForUnknownChannel() {
        when(setOperations.size("channel:presence:ch-unknown")).thenReturn(null);
        when(setOperations.members("channel:presence:ch-unknown")).thenReturn(null);

        assertEquals(0, service.getOnlineCount("ch-unknown"));
        assertTrue(service.getOnlineUserIds("ch-unknown").isEmpty());
    }

    @Test
    void shouldTrackJoinAndLeaveWithRedisSet() {
        service.join("ch-java", "u-stu-1");
        service.leave("ch-java", "u-stu-1");

        verify(setOperations).add("channel:presence:ch-java", "u-stu-1");
        verify(setOperations).remove("channel:presence:ch-java", "u-stu-1");
    }

    @Test
    void shouldReturnOnlineUsersFromRedisSet() {
        when(setOperations.members("channel:presence:ch-java")).thenReturn(Set.of("u-stu-1", "u-teacher-1"));

        Set<String> users = service.getOnlineUserIds("ch-java");

        assertEquals(2, users.size());
        assertTrue(users.contains("u-stu-1"));
        assertTrue(users.contains("u-teacher-1"));
    }

    @Test
    void shouldReturnOnlineCountFromRedisSetSize() {
        when(setOperations.size("channel:presence:ch-java")).thenReturn(2L);

        assertEquals(2, service.getOnlineCount("ch-java"));
    }

    @Test
    void shouldRemoveUserFromAllPresenceKeys() {
        when(redisTemplate.keys("channel:presence:*")).thenReturn(Set.of(
                "channel:presence:ch-java",
                "channel:presence:ch-websocket"));

        service.leaveAllChannels("u-stu-1");

        verify(setOperations).remove("channel:presence:ch-java", "u-stu-1");
        verify(setOperations).remove("channel:presence:ch-websocket", "u-stu-1");
    }

    @Test
    void shouldIgnoreLeaveAllWhenNoPresenceKeysExist() {
        when(redisTemplate.keys("channel:presence:*")).thenReturn(Set.of());

        service.leaveAllChannels("u-stu-1");

        assertTrue(true);
    }
}
