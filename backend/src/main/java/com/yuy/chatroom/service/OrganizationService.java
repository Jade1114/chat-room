package com.yuy.chatroom.service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.yuy.chatroom.dto.CreateOrganizationRequest;
import com.yuy.chatroom.dto.OrganizationDetailResponse;
import com.yuy.chatroom.dto.OrganizationSummaryResponse;
import com.yuy.chatroom.mapper.ChannelMapper;
import com.yuy.chatroom.mapper.OrganizationMapper;
import com.yuy.chatroom.mapper.OrganizationMemberMapper;
import com.yuy.chatroom.model.Channel;
import com.yuy.chatroom.model.ChannelType;
import com.yuy.chatroom.model.Organization;

@Service
public class OrganizationService {
  private final OrganizationMapper organizationMapper;
  private final OrganizationMemberMapper organizationMemberMapper;
  private final ChannelMapper channelMapper;

  public OrganizationService(OrganizationMapper organizationMapper,
      OrganizationMemberMapper organizationMemberMapper,
      ChannelMapper channelMapper) {
    this.organizationMapper = organizationMapper;
    this.organizationMemberMapper = organizationMemberMapper;
    this.channelMapper = channelMapper;
  }

  public OrganizationDetailResponse createOrganization(CreateOrganizationRequest request, String userId) {
    String orgId = "org-" + UUID.randomUUID().toString().substring(0, 8);
    String channelId = "ch-" + UUID.randomUUID().toString().substring(0, 8);
    String orgName = request.getName().trim();
    String description = request.getDescription() != null ? request.getDescription().trim() : "";

    Organization org = new Organization(orgId, orgName, description, "PUBLIC", "OPEN", userId, Instant.now());
    organizationMapper.insert(org);

    Channel channel = new Channel(channelId, orgName + " 聊天", ChannelType.ORGANIZATION, orgId, orgName + " 的默认聊天频道", false, 0);
    channelMapper.insert(channel);

    organizationMemberMapper.insertMembership(orgId, userId, "ORGANIZER");

    return getOrganization(orgId, userId).orElseThrow();
  }

  public List<OrganizationSummaryResponse> listOrganizations(String userId) {
    return organizationMapper.findAll().stream()
        .map(organization -> toSummary(organization, userId))
        .toList();
  }

  public Optional<OrganizationDetailResponse> getOrganization(String organizationId, String userId) {
    Organization organization = organizationMapper.findById(organizationId);
    if (organization == null) {
      return Optional.empty();
    }

    List<Channel> channels = channelMapper.findByOrganizationId(organizationId);
    OrganizationSummaryResponse summary = toSummary(organization, userId);
    return Optional.of(new OrganizationDetailResponse(
        summary.getId(),
        summary.getName(),
        summary.getDescription(),
        summary.getVisibility(),
        summary.getJoinPolicy(),
        summary.getMemberCount(),
        summary.isJoined(),
        summary.getDefaultChannelId(),
        channels));
  }

  public Optional<OrganizationDetailResponse> joinOrganization(String organizationId, String userId) {
    Organization organization = organizationMapper.findById(organizationId);
    if (organization == null) {
      return Optional.empty();
    }

    // Phase 2 first cut: only OPEN public organizations can be joined directly.
    if (!"PUBLIC".equals(organization.getVisibility()) || !"OPEN".equals(organization.getJoinPolicy())) {
      throw new IllegalStateException("organization is not open to join");
    }

    organizationMemberMapper.insertMembership(organizationId, userId, "MEMBER");
    return getOrganization(organizationId, userId);
  }

  private OrganizationSummaryResponse toSummary(Organization organization, String userId) {
    return new OrganizationSummaryResponse(
        organization.getId(),
        organization.getName(),
        organization.getDescription(),
        organization.getVisibility(),
        organization.getJoinPolicy(),
        organizationMemberMapper.countMembers(organization.getId()),
        isJoined(organization.getId(), userId),
        channelMapper.findDefaultChannelId(organization.getId()));
  }

  private boolean isJoined(String organizationId, String userId) {
    if (userId == null || userId.isBlank()) {
      return false;
    }
    return organizationMemberMapper.countMembership(userId, organizationId) > 0;
  }
}
