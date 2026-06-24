export type ConnectionStatus = "idle" | "connecting" | "connected";

export type MessageType =
  | "USER_JOIN"
  | "USER_LEAVE"
  | "USER_CHAT"
  | "MESSAGE_ACK"
  | "WORKSPACE_JOIN"
  | "CHANNEL_VIEW_CHANGED"
  | "UNREAD_CHANGED";
export type UserRole = "MEMBER" | "ORGANIZER" | "ADMIN";
export type ChannelType = "ORGANIZATION";

export interface ChatMessagePayload {
  type: MessageType;
  displayName: string;
  channelId?: string;
  content?: string;
  messageId?: string;
  sentAt?: string;
  userId?: string;
}

export type DeliveryStatus = "sending" | "accepted" | "delivered" | "failed";

export interface TimelineItem {
  id: string;
  role: "system" | "me" | "user";
  text: string;
  time: string;
  displayName?: string;
  messageId?: string;
  deliveryStatus?: DeliveryStatus;
}

export interface CurrentUser {
  id: string;
  displayName: string;
  role: UserRole;
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  organizationId: string;
  description: string;
  readonly: boolean;
  unreadCount: number;
}

export interface ChannelDetail extends Channel {
  onlineCount: number;
  onlineUsers: string[];
}
