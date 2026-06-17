import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { wsUrl } from '../config';
import { fetchChannelDetail, fetchChannels, fetchCurrentUser, fetchMockUsers } from '../lib/chatApi';
import {
  activeChannelDetailAtom,
  canSendAtom,
  channelIdAtom,
  channelsAtom,
  currentUserAtom,
  displayNameAtom,
  draftAtom,
  loadingChannelDetailAtom,
  loadingChannelsAtom,
  loadingUsersAtom,
  lobbyErrorAtom,
  mockUsersAtom,
  selectedChannelIdAtom,
  selectedUserIdAtom,
  statusAtom,
  timelineAtom
} from '../state/chatAtoms';
import type { ChatMessagePayload, TimelineItem } from '../types/chat';

function nowLabel() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function createTimelineItem(payload: Omit<TimelineItem, 'id' | 'time'>): TimelineItem {
  return {
    id: `${Date.now()}-${Math.random()}`,
    time: nowLabel(),
    ...payload
  };
}

export function useChatRoom() {
  const [draft, setDraft] = useAtom(draftAtom);
  const [selectedUserId, setSelectedUserId] = useAtom(selectedUserIdAtom);
  const selectedChannelId = useAtomValue(selectedChannelIdAtom);
  const displayName = useAtomValue(displayNameAtom);
  const currentUser = useAtomValue(currentUserAtom);
  const canSend = useAtomValue(canSendAtom);
  const setStatus = useSetAtom(statusAtom);
  const setTimeline = useSetAtom(timelineAtom);
  const setMockUsers = useSetAtom(mockUsersAtom);
  const setCurrentUser = useSetAtom(currentUserAtom);
  const setChannels = useSetAtom(channelsAtom);
  const setChannelId = useSetAtom(channelIdAtom);
  const setActiveChannelDetail = useSetAtom(activeChannelDetailAtom);
  const setLoadingUsers = useSetAtom(loadingUsersAtom);
  const setLoadingChannels = useSetAtom(loadingChannelsAtom);
  const setLoadingChannelDetail = useSetAtom(loadingChannelDetailAtom);
  const setLobbyError = useSetAtom(lobbyErrorAtom);
  const socketRef = useRef<WebSocket | null>(null);

  const pushSystem = useCallback(
    (text: string) => {
      setTimeline((current) => [...current, createTimelineItem({ role: 'system', text })]);
    },
    [setTimeline]
  );

  const pushChat = useCallback(
    (sender: string, text: string) => {
      setTimeline((current) => [
        ...current,
        createTimelineItem({
          role: sender === displayName ? 'me' : 'user',
          sender,
          text
        })
      ]);
    },
    [displayName, setTimeline]
  );

  const refreshChannelDetail = useCallback(
    async (targetChannelId = selectedChannelId, targetUserId = selectedUserId) => {
      if (!targetChannelId) {
        setActiveChannelDetail(null);
        return;
      }

      setLoadingChannelDetail(true);
      try {
        setActiveChannelDetail(await fetchChannelDetail(targetChannelId, targetUserId));
      } catch {
        setActiveChannelDetail(null);
      } finally {
        setLoadingChannelDetail(false);
      }
    },
    [selectedChannelId, selectedUserId, setActiveChannelDetail, setLoadingChannelDetail]
  );

  const refreshChannels = useCallback(
    async (targetUserId = selectedUserId) => {
      setLoadingChannels(true);
      setLobbyError('');
      try {
        const nextChannels = await fetchChannels(targetUserId);
        setChannels(nextChannels);
        setChannelId((currentChannelId) => {
          if (nextChannels.some((channel) => channel.id === currentChannelId)) {
            return currentChannelId;
          }
          return nextChannels[0]?.id || '';
        });
      } catch {
        setChannels([]);
        setLobbyError('频道加载失败');
      } finally {
        setLoadingChannels(false);
      }
    },
    [selectedUserId, setChannelId, setChannels, setLoadingChannels, setLobbyError]
  );

  const refreshUser = useCallback(
    async (targetUserId = selectedUserId) => {
      setLoadingUsers(true);
      setLobbyError('');
      try {
        const user = await fetchCurrentUser(targetUserId);
        setCurrentUser(user);
        if (!targetUserId) {
          setSelectedUserId(user.id);
        }
        return user;
      } catch {
        setCurrentUser(null);
        setLobbyError('用户加载失败');
        return null;
      } finally {
        setLoadingUsers(false);
      }
    },
    [selectedUserId, setCurrentUser, setLoadingUsers, setLobbyError, setSelectedUserId]
  );

  const refreshLobby = useCallback(async () => {
    const user = await refreshUser(selectedUserId);
    const userId = user?.id || selectedUserId;
    await refreshChannels(userId);
    await refreshChannelDetail(selectedChannelId, userId);
  }, [refreshChannelDetail, refreshChannels, refreshUser, selectedChannelId, selectedUserId]);

  const loadMockUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const users = await fetchMockUsers();
      setMockUsers(users);
      setSelectedUserId((current) => current || users[0]?.id || '');
    } catch {
      setMockUsers([]);
      setLobbyError('模拟用户加载失败');
    } finally {
      setLoadingUsers(false);
    }
  }, [setLoadingUsers, setLobbyError, setMockUsers, setSelectedUserId]);

  const handleServerMessage = useCallback(
    (raw: string) => {
      let message: Partial<ChatMessagePayload>;

      try {
        message = JSON.parse(raw) as Partial<ChatMessagePayload>;
      } catch {
        pushSystem('收到无法解析的消息。');
        return;
      }

      switch (message.type) {
        case 'USER_CHAT':
          pushChat(message.sender || '未知用户', message.content || '');
          break;
        case 'USER_JOIN':
        case 'USER_LEAVE':
          pushSystem(`${message.sender || '未知用户'} ${message.content || ''}`.trim());
          break;
        default:
          pushSystem('收到未知消息类型。');
          break;
      }

      refreshChannelDetail();
    },
    [pushChat, pushSystem, refreshChannelDetail]
  );

  const connect = useCallback(() => {
    if (!currentUser || !displayName || !selectedChannelId) {
      pushSystem('请选择用户和频道后再连接。');
      return;
    }

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setStatus('connecting');
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus('connected');
      pushSystem(`已进入 ${selectedChannelId}`);
      socket.send(
        JSON.stringify({
          type: 'USER_JOIN',
          sender: displayName,
          roomId: selectedChannelId,
          content: '进入了当前频道'
        } satisfies ChatMessagePayload)
      );
      refreshChannelDetail();
    };

    socket.onmessage = (event) => {
      handleServerMessage(event.data as string);
    };

    socket.onerror = () => {
      pushSystem('连接出错，请检查服务状态或地址。');
    };

    socket.onclose = () => {
      setStatus('idle');
      pushSystem('连接已关闭。');
      socketRef.current = null;
      refreshChannelDetail();
    };
  }, [currentUser, displayName, handleServerMessage, pushSystem, refreshChannelDetail, selectedChannelId, setStatus]);

  const disconnect = useCallback(() => {
    socketRef.current?.close();
  }, []);

  const sendChat = useCallback(() => {
    if (!canSend || !socketRef.current) {
      return;
    }

    const text = draft.trim();
    socketRef.current.send(
      JSON.stringify({
        type: 'USER_CHAT',
        sender: displayName,
        roomId: selectedChannelId,
        content: text
      } satisfies ChatMessagePayload)
    );
    setDraft('');
  }, [canSend, displayName, draft, selectedChannelId, setDraft]);

  const pickChannel = useCallback(
    (targetChannelId: string) => {
      setChannelId(targetChannelId);
      refreshChannelDetail(targetChannelId);
    },
    [refreshChannelDetail, setChannelId]
  );

  const switchUser = useCallback(
    (targetUserId: string) => {
      socketRef.current?.close();
      setTimeline([]);
      setSelectedUserId(targetUserId);
      setActiveChannelDetail(null);
    },
    [setActiveChannelDetail, setSelectedUserId, setTimeline]
  );

  useEffect(() => {
    loadMockUsers();
  }, [loadMockUsers]);

  useEffect(() => {
    if (!selectedUserId) {
      return;
    }

    refreshLobby();
    const pollingTimer = window.setInterval(refreshLobby, 5000);

    return () => {
      window.clearInterval(pollingTimer);
    };
  }, [refreshLobby, selectedUserId]);

  useEffect(() => {
    return () => {
      socketRef.current?.close();
    };
  }, []);

  return {
    connect,
    disconnect,
    pickChannel,
    refreshChannelDetail,
    refreshLobby,
    sendChat,
    switchUser
  };
}
