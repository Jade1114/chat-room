export type ConnectionStatus = 'idle' | 'connecting' | 'connected';

export type MessageType = 'USER_JOIN' | 'USER_LEAVE' | 'USER_CHAT';

export interface ChatMessagePayload {
  type: MessageType;
  sender: string;
  roomId: string;
  content: string;
}

export interface TimelineItem {
  id: string;
  role: 'system' | 'me' | 'user';
  text: string;
  time: string;
  sender?: string;
}

export interface RoomSummary {
  roomId: string;
  onlineCount: number;
}

export interface RoomDetail {
  roomId: string;
  onlineCount: number;
  usernames: string[];
}
