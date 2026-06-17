package com.yuy.chatroom.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.yuy.chatroom.model.Channel;
import com.yuy.chatroom.model.ChannelDetail;
import com.yuy.chatroom.model.ChannelType;
import com.yuy.chatroom.model.CurrentUser;
import com.yuy.chatroom.model.UserRole;

@Service
public class CampusDirectoryService {
    private static final String DEFAULT_USER_ID = "u-stu-1";

    private final Map<String, CurrentUser> users = Map.of(
            "u-stu-1", new CurrentUser(
                    "u-stu-1",
                    "Yuy",
                    UserRole.STUDENT,
                    "school-1",
                    "dept-cs",
                    "class-cs-2401",
                    List.of("course-java", "course-websocket")),
            "u-stu-2", new CurrentUser(
                    "u-stu-2",
                    "Mina",
                    UserRole.STUDENT,
                    "school-1",
                    "dept-cs",
                    "class-cs-2402",
                    List.of("course-java")),
            "u-teacher-1", new CurrentUser(
                    "u-teacher-1",
                    "Chen",
                    UserRole.TEACHER,
                    "school-1",
                    "dept-cs",
                    null,
                    List.of("course-java", "course-websocket")),
            "u-admin-1", new CurrentUser(
                    "u-admin-1",
                    "Admin",
                    UserRole.ADMIN,
                    "school-1",
                    null,
                    null,
                    List.of()));

    private final List<Channel> channels = List.of(
            new Channel(
                    "ch-school",
                    "全校大厅",
                    ChannelType.SCHOOL,
                    "school-1",
                    "星河大学公共频道",
                    false),
            new Channel(
                    "ch-cs",
                    "计算机学院",
                    ChannelType.DEPARTMENT,
                    "dept-cs",
                    "计算机学院公共频道",
                    false),
            new Channel(
                    "ch-math",
                    "数学学院",
                    ChannelType.DEPARTMENT,
                    "dept-math",
                    "数学学院公共频道",
                    false),
            new Channel(
                    "ch-cs-2401",
                    "计科 2401 班",
                    ChannelType.CLASS,
                    "class-cs-2401",
                    "计科 2401 班级频道",
                    false),
            new Channel(
                    "ch-cs-2402",
                    "计科 2402 班",
                    ChannelType.CLASS,
                    "class-cs-2402",
                    "计科 2402 班级频道",
                    false),
            new Channel(
                    "ch-math-2401",
                    "数学 2401 班",
                    ChannelType.CLASS,
                    "class-math-2401",
                    "数学 2401 班级频道",
                    false),
            new Channel(
                    "ch-java",
                    "Java 后端开发",
                    ChannelType.COURSE,
                    "course-java",
                    "课程讨论与通知",
                    false),
            new Channel(
                    "ch-websocket",
                    "分布式实时通信",
                    ChannelType.COURSE,
                    "course-websocket",
                    "WebSocket、Redis、RabbitMQ 实战频道",
                    false),
            new Channel(
                    "ch-linear-algebra",
                    "线性代数",
                    ChannelType.COURSE,
                    "course-linear-algebra",
                    "线性代数课程频道",
                    false));

    public CurrentUser getCurrentUser(String userId) {
        return users.getOrDefault(normalizeUserId(userId), users.get(DEFAULT_USER_ID));
    }

    public List<CurrentUser> getUsers() {
        return List.copyOf(users.values());
    }

    public List<Channel> getAccessibleChannels(String userId) {
        CurrentUser user = getCurrentUser(userId);
        return channels.stream()
                .filter(channel -> canAccess(user, channel))
                .toList();
    }

    public Optional<ChannelDetail> getAccessibleChannelDetail(String userId, String channelId) {
        CurrentUser user = getCurrentUser(userId);
        return channels.stream()
                .filter(channel -> channel.getId().equals(channelId))
                .filter(channel -> canAccess(user, channel))
                .findFirst()
                .map(channel -> toChannelDetail(channel, user));
    }

    public boolean canAccess(String userId, String channelId) {
        CurrentUser user = getCurrentUser(userId);
        return channels.stream()
                .filter(channel -> channel.getId().equals(channelId))
                .anyMatch(channel -> canAccess(user, channel));
    }

    private boolean canAccess(CurrentUser user, Channel channel) {
        if (user.getRole() == UserRole.ADMIN) {
            return true;
        }

        return switch (channel.getType()) {
            case SCHOOL -> channel.getScopeId().equals(user.getSchoolId());
            case DEPARTMENT -> channel.getScopeId().equals(user.getDepartmentId());
            case CLASS -> channel.getScopeId().equals(user.getClassId());
            case COURSE -> user.getCourseIds().contains(channel.getScopeId());
        };
    }

    private ChannelDetail toChannelDetail(Channel channel, CurrentUser user) {
        return new ChannelDetail(
                channel.getId(),
                channel.getName(),
                channel.getType(),
                channel.getScopeId(),
                channel.getDescription(),
                channel.isReadonly(),
                0,
                List.of(user.getDisplayName()));
    }

    private String normalizeUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            return DEFAULT_USER_ID;
        }
        return userId;
    }
}
