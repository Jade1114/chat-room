import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { wsUrl } from '../config';
import { fetchRoomDetail, fetchRooms } from '../lib/chatApi';
import {
  activeRoomDetailAtom,
  canSendAtom,
  draftAtom,
  loadingDetailAtom,
  loadingRoomsAtom,
  roomIdAtom,
  roomsAtom,
  selectedRoomAtom,
  statusAtom,
  timelineAtom,
  trimmedUsernameAtom
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
  const [roomId, setRoomId] = useAtom(roomIdAtom);
  const trimmedUsername = useAtomValue(trimmedUsernameAtom);
  const selectedRoom = useAtomValue(selectedRoomAtom);
  const canSend = useAtomValue(canSendAtom);
  const setStatus = useSetAtom(statusAtom);
  const setTimeline = useSetAtom(timelineAtom);
  const setRooms = useSetAtom(roomsAtom);
  const setActiveRoomDetail = useSetAtom(activeRoomDetailAtom);
  const setLoadingRooms = useSetAtom(loadingRoomsAtom);
  const setLoadingDetail = useSetAtom(loadingDetailAtom);
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
          role: sender === trimmedUsername ? 'me' : 'user',
          sender,
          text
        })
      ]);
    },
    [setTimeline, trimmedUsername]
  );

  const refreshRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const nextRooms = await fetchRooms();
      setRooms(nextRooms);
      setRoomId((currentRoomId) => {
        if (!currentRoomId.trim() && nextRooms.length > 0) {
          return nextRooms[0].roomId;
        }
        return currentRoomId;
      });
    } catch {
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  }, [setLoadingRooms, setRoomId, setRooms]);

  const refreshRoomDetail = useCallback(
    async (targetRoomId = selectedRoom) => {
      if (!targetRoomId) {
        setActiveRoomDetail(null);
        return;
      }

      setLoadingDetail(true);
      try {
        setActiveRoomDetail(await fetchRoomDetail(targetRoomId));
      } catch {
        setActiveRoomDetail(null);
      } finally {
        setLoadingDetail(false);
      }
    },
    [selectedRoom, setActiveRoomDetail, setLoadingDetail]
  );

  const refreshLobby = useCallback(async () => {
    await refreshRooms();
    await refreshRoomDetail(selectedRoom);
  }, [refreshRoomDetail, refreshRooms, selectedRoom]);

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

      refreshLobby();
    },
    [pushChat, pushSystem, refreshLobby]
  );

  const connect = useCallback(() => {
    if (!trimmedUsername || !selectedRoom) {
      pushSystem('请输入昵称和房间号后再连接。');
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
      pushSystem(`已连接到房间 ${selectedRoom}`);
      socket.send(
        JSON.stringify({
          type: 'USER_JOIN',
          sender: trimmedUsername,
          roomId: selectedRoom,
          content: '进入了当前频道'
        } satisfies ChatMessagePayload)
      );
      refreshLobby();
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
      refreshLobby();
    };
  }, [handleServerMessage, pushSystem, refreshLobby, selectedRoom, setStatus, trimmedUsername]);

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
        sender: trimmedUsername,
        roomId: selectedRoom,
        content: text
      } satisfies ChatMessagePayload)
    );
    setDraft('');
  }, [canSend, draft, selectedRoom, setDraft, trimmedUsername]);

  const pickRoom = useCallback(
    (targetRoomId: string) => {
      setRoomId(targetRoomId);
      refreshRoomDetail(targetRoomId);
    },
    [refreshRoomDetail, setRoomId]
  );

  useEffect(() => {
    refreshLobby();
    const pollingTimer = window.setInterval(refreshLobby, 5000);

    return () => {
      socketRef.current?.close();
      window.clearInterval(pollingTimer);
    };
  }, [refreshLobby]);

  return {
    connect,
    disconnect,
    pickRoom,
    refreshLobby,
    refreshRoomDetail,
    sendChat,
    setDraft,
    setRoomId,
    roomId
  };
}
