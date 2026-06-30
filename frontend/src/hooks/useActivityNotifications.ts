import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { notificationWsUrl } from '../config';
import { getToken } from '../lib/authApi';
import { getLocalSessionId } from '../lib/localSession';

export type ActivityNotificationKind = 'interest' | 'update';

export interface ActivityNotification {
  id: string;
  kind: ActivityNotificationKind;
  activityId: string;
  activityTitle: string;
  interestCount?: number;
  updateId?: string;
  message: string;
}

interface ServerActivityInterestHint {
  type: 'ACTIVITY_INTEREST_HINT';
  activityId: string;
  activityTitle: string;
  interestCount: number;
  message: string;
}

interface ServerActivityUpdateHint {
  type: 'ACTIVITY_UPDATE_PUBLISHED';
  activityId: string;
  activityTitle: string;
  updateId: string;
  message: string;
}

function buildNotificationSocketUrl() {
  const url = new URL(notificationWsUrl);
  url.searchParams.set('localSessionId', getLocalSessionId());
  const token = getToken();
  if (token) url.searchParams.set('token', token);
  return url.toString();
}

function parseNotification(payload: string): ActivityNotification | null {
  const message = JSON.parse(payload) as Partial<ServerActivityInterestHint> | Partial<ServerActivityUpdateHint>;
  if (message.type === 'ACTIVITY_INTEREST_HINT' && message.activityId && message.activityTitle) {
    return {
      id: `${message.activityId}-interest-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      kind: 'interest',
      activityId: message.activityId,
      activityTitle: message.activityTitle,
      interestCount: Number(message.interestCount ?? 0),
      message: message.message || '有人对你的 Activity 感兴趣'
    };
  }
  if (message.type === 'ACTIVITY_UPDATE_PUBLISHED' && message.activityId && message.activityTitle && message.updateId) {
    return {
      id: `${message.activityId}-${message.updateId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      kind: 'update',
      activityId: message.activityId,
      activityTitle: message.activityTitle,
      updateId: message.updateId,
      message: message.message || '你感兴趣的活动有新补充'
    };
  }
  return null;
}

export function useActivityNotifications(enabled: boolean, identityKey: string) {
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const removeNotification = useCallback((id: string) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id));
  }, []);

  const connectionKey = useMemo(() => `${enabled ? 'enabled' : 'disabled'}:${identityKey}`, [enabled, identityKey]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const socket = new WebSocket(buildNotificationSocketUrl());
    socketRef.current = socket;

    socket.onmessage = (event) => {
      if (socketRef.current !== socket) {
        return;
      }
      try {
        const notification = parseNotification(String(event.data));
        if (!notification) {
          return;
        }
        setNotifications((current) => [notification, ...current].slice(0, 1));
      } catch {
        // Ignore malformed notification payloads. Notification is best-effort UI state.
      }
    };

    socket.onclose = () => {
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };

    socket.onerror = () => {
      if (socketRef.current === socket) {
        socket.close();
      }
    };

    return () => {
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      if (socket.readyState !== WebSocket.CLOSED && socket.readyState !== WebSocket.CLOSING) {
        socket.close();
      }
    };
  }, [connectionKey, enabled, removeNotification]);

  return { notifications, removeNotification };
}
