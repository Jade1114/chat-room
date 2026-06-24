package com.yuy.chatroom.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.yuy.chatroom.dto.CreateOrganizationRequest;
import com.yuy.chatroom.dto.OrganizationDetailResponse;
import com.yuy.chatroom.dto.OrganizationSummaryResponse;
import com.yuy.chatroom.service.OrganizationService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;

@RestController
@RequestMapping("/api/organizations")
@AllArgsConstructor
public class OrganizationController {
  private final OrganizationService organizationService;

  @GetMapping
  public List<OrganizationSummaryResponse> listOrganizations(HttpServletRequest request) {
    String userId = resolveUserId(request);
    return organizationService.listOrganizations(userId);
  }

  @GetMapping("/{organizationId}")
  public ResponseEntity<OrganizationDetailResponse> getOrganization(
      @PathVariable String organizationId,
      HttpServletRequest request) {
    String userId = resolveUserId(request);
    return organizationService.getOrganization(organizationId, userId)
        .map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @PostMapping
  public ResponseEntity<?> createOrganization(
      @RequestBody CreateOrganizationRequest createRequest,
      HttpServletRequest request) {
    String userId = resolveUserId(request);
    if (userId == null || userId.isBlank()) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "未登录"));
    }

    if (createRequest.getName() == null || createRequest.getName().trim().isEmpty()) {
      return ResponseEntity.badRequest().body(Map.of("error", "组织名称不能为空"));
    }

    if (createRequest.getName().trim().length() > 64) {
      return ResponseEntity.badRequest().body(Map.of("error", "组织名称不能超过 64 个字符"));
    }

    OrganizationDetailResponse org = organizationService.createOrganization(createRequest, userId);
    return ResponseEntity.ok(org);
  }

  @PostMapping("/{organizationId}/join")
  public ResponseEntity<?> joinOrganization(
      @PathVariable String organizationId,
      HttpServletRequest request) {
    String userId = resolveUserId(request);
    if (userId == null || userId.isBlank()) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "未登录"));
    }

    try {
      return organizationService.joinOrganization(organizationId, userId)
          .<ResponseEntity<?>>map(ResponseEntity::ok)
          .orElseGet(() -> ResponseEntity.notFound().build());
    } catch (IllegalStateException error) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", error.getMessage()));
    }
  }

  private String resolveUserId(HttpServletRequest request) {
    return (String) request.getAttribute("userId");
  }
}
