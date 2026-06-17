package com.yuy.chatroom.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.yuy.chatroom.mapper.ChannelMapper;
import com.yuy.chatroom.mapper.UserMapper;
import com.yuy.chatroom.model.Channel;
import com.yuy.chatroom.model.ChannelDetail;
import com.yuy.chatroom.model.ChannelType;
import com.yuy.chatroom.model.CurrentUser;
import com.yuy.chatroom.model.UserRole;

@ExtendWith(MockitoExtension.class)
public class CampusDirectoryServiceTest {
    @Mock
    private UserMapper userMapper;
    @Mock
    private ChannelMapper channelMapper;

    private ChannelPresenceService presenceService;
    private CampusDirectoryService service;

    @BeforeEach
    void setUp() {
        presenceService = new ChannelPresenceService();
        service = new CampusDirectoryService(userMapper, channelMapper, presenceService);

        when(userMapper.findById("u-stu-1")).thenReturn(studentYuy());
        when(userMapper.findCourseIdsByUserId("u-stu-1")).thenReturn(List.of("course-java", "course-websocket"));

        when(userMapper.findById("u-teacher-1")).thenReturn(teacherChen());
        when(userMapper.findCourseIdsByUserId("u-teacher-1")).thenReturn(List.of("course-java", "course-websocket"));

        when(userMapper.findById("u-admin-1")).thenReturn(admin());
        when(userMapper.findCourseIdsByUserId("u-admin-1")).thenReturn(List.of());

        when(userMapper.findAll()).thenReturn(List.of(studentYuy(), teacherChen(), admin()));

        when(channelMapper.findAll()).thenReturn(allChannels());
        when(channelMapper.findById(anyString())).thenAnswer(invocation -> {
            String id = invocation.getArgument(0);
            return allChannels().stream().filter(c -> c.getId().equals(id)).findFirst().orElse(null);
        });
    }

    @Test
    void shouldReturnDefaultUserWhenUserIdMissing() {
        when(userMapper.findById("u-stu-1")).thenReturn(studentYuy());

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
        when(userMapper.findById("u-stu-1")).thenReturn(studentYuy());
        when(userMapper.findCourseIdsByUserId("u-stu-1")).thenReturn(List.of("course-java", "course-websocket"));

        Optional<ChannelDetail> detail = service.getAccessibleChannelDetail("u-stu-1", "ch-java");

        assertTrue(detail.isPresent());
        assertEquals(1, detail.get().getOnlineCount());
        assertTrue(detail.get().getOnlineUsers().contains("Yuy"));
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

    private static CurrentUser studentYuy() {
        return new CurrentUser("u-stu-1", "Yuy", UserRole.STUDENT, "school-1", "dept-cs", "class-cs-2401", null);
    }

    private static CurrentUser teacherChen() {
        return new CurrentUser("u-teacher-1", "Chen", UserRole.TEACHER, "school-1", "dept-cs", null, null);
    }

    private static CurrentUser admin() {
        return new CurrentUser("u-admin-1", "Admin", UserRole.ADMIN, "school-1", null, null, null);
    }

    private static List<Channel> allChannels() {
        return List.of(
                new Channel("ch-school", "全校大厅", ChannelType.SCHOOL, "school-1", "星河大学公共频道", false),
                new Channel("ch-cs", "计算机学院", ChannelType.DEPARTMENT, "dept-cs", "计算机学院公共频道", false),
                new Channel("ch-math", "数学学院", ChannelType.DEPARTMENT, "dept-math", "数学学院公共频道", false),
                new Channel("ch-cs-2401", "计科 2401 班", ChannelType.CLASS, "class-cs-2401", "计科 2401 班级频道", false),
                new Channel("ch-cs-2402", "计科 2402 班", ChannelType.CLASS, "class-cs-2402", "计科 2402 班级频道", false),
                new Channel("ch-math-2401", "数学 2401 班", ChannelType.CLASS, "class-math-2401", "数学 2401 班级频道", false),
                new Channel("ch-java", "Java 后端开发", ChannelType.COURSE, "course-java", "课程讨论与通知", false),
                new Channel("ch-websocket", "分布式实时通信", ChannelType.COURSE, "course-websocket", "WebSocket频道", false),
                new Channel("ch-linear-algebra", "线性代数", ChannelType.COURSE, "course-linear-algebra", "线性代数课程频道", false));
    }
}
