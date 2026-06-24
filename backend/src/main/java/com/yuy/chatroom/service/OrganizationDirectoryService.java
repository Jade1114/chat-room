package com.yuy.chatroom.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.yuy.chatroom.mapper.ChannelMapper;
import com.yuy.chatroom.mapper.OrganizationMemberMapper;
import com.yuy.chatroom.mapper.UserMapper;
import com.yuy.chatroom.model.Channel;
import com.yuy.chatroom.model.ChannelDetail;
import com.yuy.chatroom.model.CurrentUser;
import com.yuy.chatroom.model.UserRole;

@Service
public class OrganizationDirectoryService {

  private final UserMapper userMapper;
  private final ChannelMapper channelMapper;
  private final OrganizationMemberMapper organizationMemberMapper;
  private final ChannelPresenceService presenceService;

  public OrganizationDirectoryService(UserMapper userMapper, ChannelMapper channelMapper,
      OrganizationMemberMapper organizationMemberMapper,
      ChannelPresenceService presenceService) {
    this.userMapper = userMapper;
    this.channelMapper = channelMapper;
    this.organizationMemberMapper = organizationMemberMapper;
    this.presenceService = presenceService;
  }

  public CurrentUser getCurrentUser(String userId) {
    if (userId == null || userId.isBlank()) {
      return null;
    }
    CurrentUser user = userMapper.findById(userId);
    return user;
  }

  public List<CurrentUser> getUsers() {
    return userMapper.findAll();
  }

  public List<Channel> getAccessibleChannels(String userId) {
    CurrentUser user = getCurrentUser(userId);
    return channelMapper.findAll().stream()
        .filter(channel -> canAccess(user, channel))
        .toList();
  }

  public Optional<ChannelDetail> getAccessibleChannelDetail(String userId, String channelId) {
    CurrentUser user = getCurrentUser(userId);
    Channel channel = channelMapper.findById(channelId);
    if (channel == null || !canAccess(user, channel)) {
      return Optional.empty();
    }
    return Optional.of(toChannelDetail(channel));
  }

  public boolean canAccess(String userId, String channelId) {
    CurrentUser user = getCurrentUser(userId);
    Channel channel = channelMapper.findById(channelId);
    return channel != null && canAccess(user, channel);
  }

  public Set<String> getAccessibleUserIds(String channelId) {
    Channel channel = channelMapper.findById(channelId);
    if (channel == null) {
      return Set.of();
    }

    return getUsers().stream()
        .filter(user -> canAccess(user, channel))
        .map(CurrentUser::getId)
        .collect(Collectors.toSet());
  }

  private boolean canAccess(CurrentUser user, Channel channel) {
    if (user == null || channel == null) {
      return false;
    }

    if (user.getRole() == UserRole.ADMIN) {
      return true;
    }

    // MVP rule: channel access is derived from organization membership.
    // organization_channel.organization_id is the owning organization id.
    return organizationMemberMapper.countMembership(user.getId(), channel.getOrganizationId()) > 0;
  }

  private ChannelDetail toChannelDetail(Channel channel) {
    Set<String> accessibleUserIds = getAccessibleUserIds(channel.getId());
    Set<String> onlineUserIds = presenceService.getWorkspaceOnlineUserIds().stream()
        .filter(accessibleUserIds::contains)
        .collect(Collectors.toSet());

    // Resolve userIds to display names.
    // TODO: N+1 — batch-load user display names instead of querying one by one.
    Map<String, String> idToName = onlineUserIds.stream()
        .map(this::getCurrentUser)
        .filter(user -> user != null)
        .collect(Collectors.toMap(CurrentUser::getId, CurrentUser::getDisplayName));
    List<String> displayNames = onlineUserIds.stream()
        .map(idToName::get)
        .filter(name -> name != null)
        .toList();

    return new ChannelDetail(
        channel.getId(),
        channel.getName(),
        channel.getType(),
        channel.getOrganizationId(),
        channel.getDescription(),
        channel.isReadonly(),
        onlineUserIds.size(),
        displayNames);
  }

  private String normalizeUserId(String userId) {
    if (userId == null || userId.isBlank()) {
      return null;
    }
    return userId;
  }
}
