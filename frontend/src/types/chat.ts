export type ConnectionStatus = "idle" | "connecting" | "connected";

export type MessageType =
  | "USER_JOIN"
  | "USER_LEAVE"
  | "USER_CHAT"
  | "MESSAGE_ACK"
  | "WORKSPACE_JOIN"
  | "CHANNEL_VIEW_CHANGED";
export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";
export type ChannelType = "SCHOOL" | "DEPARTMENT" | "CLASS" | "COURSE";

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
  schoolId: string;
  departmentId: string | null;
  classId: string | null;
  courseIds: string[];
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  scopeId: string;
  description: string;
  readonly: boolean;
}

export interface ChannelDetail extends Channel {
  onlineCount: number;
  onlineUsers: string[];
}
