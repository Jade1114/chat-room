import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { notificationWsUrl } from '../config';
import { getToken } from '../lib/authApi';
import { getLocalSessionId } from '../lib/localSession';

export interface ActivityInterestNotification {
  id: string;
  activityId: string;
  activityTitle: string;
  interestCount: number;
  message: string;
}

interface ServerActivityInterestHint {
  type: 'ACTIVITY_INTEREST_HINT';
  activityId: string;
  activityTitle: string;
  interestCount: number;
  message: string;
}

function buildNotificationSocketUrl() {
  const url = new URL(notificationWsUrl);
  url.searchParams.set('localSessionId', getLocalSessionId());
  const token = getToken();
  if (token) url.searchParams.set('token', token);
  return url.toString();
}

function parseNotification(payload: string): ActivityInterestNotification | null {
  const message = JSON.parse(payload) as Partial<ServerActivityInterestHint>;
  if (message.type !== 'ACTIVITY_INTEREST_HINT' || !message.activityId || !message.activityTitle) {
    return null;
  }
  return {
    id: `${message.activityId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    activityId: message.activityId,
    activityTitle: message.activityTitle,
    interestCount: Number(message.interestCount ?? 0),
    message: message.message || '有人对你的 Activity 感兴趣'
  };
}

export function useActivityNotifications(enabled: boolean, identityKey: string) {
  const [notifications, setNotifications] = useState<ActivityInterestNotification[]>([]);
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
