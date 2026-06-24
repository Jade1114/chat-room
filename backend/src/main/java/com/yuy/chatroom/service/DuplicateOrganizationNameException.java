package com.yuy.chatroom.service;

public class DuplicateOrganizationNameException extends RuntimeException {
  public DuplicateOrganizationNameException(String organizationName) {
    super("组织名称已存在: " + organizationName);
  }
}
