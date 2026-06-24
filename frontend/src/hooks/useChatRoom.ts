import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { wsUrl } from "../config";
import { fetchChannelDetail, fetchChannelMessages, fetchChannels } from "../lib/chatApi";
import { getToken } from "../lib/authApi";
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
  lobbyErrorAtom,
  selectedChannelIdAtom,
  statusAtom,
  timelineAtom,
  unreadCountsAtom,
} from "../state/chatAtoms";
import type { ChatMessagePayload, TimelineItem } from "../types/chat";

function nowLabel(value = new Date()) {
  return value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function createTimelineItem(
  payload: Omit<TimelineItem, "id" | "time"> & { time?: string }
): TimelineItem {
  return {
    id: payload.messageId || `${Date.now()}-${Math.random()}`,
    time: payload.time || nowLabel(),
    ...payload,
  };
}

function chatMessageToTimelineItem(
  message: ChatMessagePayload,
  currentUserId: string,
  currentDisplayName: string
): TimelineItem {
  const sentAt = message.sentAt ? new Date(message.sentAt) : undefined;
  const role = message.userId === currentUserId || message.displayName === currentDisplayName ? "me" : "user";

  return createTimelineItem({
    role,
    displayName: message.displayName || "未知用户",
    text: message.content || "",
    messageId: message.messageId,
    time: sentAt ? nowLabel(sentAt) : undefined,
    deliveryStatus: role === "me" ? "delivered" : undefined,
  });
}

function mergeTimelines(historyItems: TimelineItem[], currentItems: TimelineItem[]) {
  const seenMessageIds = new Set<string>();
  const merged: TimelineItem[] = [];

  for (const item of [...historyItems, ...currentItems]) {
    if (item.messageId) {
      if (seenMessageIds.has(item.messageId)) {
        continue;
      }
      seenMessageIds.add(item.messageId);
    }
    merged.push(item);
  }

  return merged;
}

export interface UseChatRoomOptions {
  initialChannelId?: string;
}

export function useChatRoom(options: UseChatRoomOptions = {}) {
  const initialChannelId = options.initialChannelId?.trim() || '';
  const [draft, setDraft] = useAtom(draftAtom);
  const selectedChannelId = useAtomValue(selectedChannelIdAtom);
  const displayName = useAtomValue(displayNameAtom);
  const currentUser = useAtomValue(currentUserAtom);
  const canSend = useAtomValue(canSendAtom);
  const setStatus = useSetAtom(statusAtom);
  const setTimeline = useSetAtom(timelineAtom);
  const setChannels = useSetAtom(channelsAtom);
  const setUnreadCounts = useSetAtom(unreadCountsAtom);
  const setChannelId = useSetAtom(channelIdAtom);
  const setActiveChannelDetail = useSetAtom(activeChannelDetailAtom);
  const setLoadingChannels = useSetAtom(loadingChannelsAtom);
  const setLoadingChannelDetail = useSetAtom(loadingChannelDetailAtom);
  const setLobbyError = useSetAtom(lobbyErrorAtom);
  const socketRef = useRef<WebSocket | null>(null);
  const socketChannelRef = useRef("");
  const selectedChannelRef = useRef("");
  const channelTimelinesRef = useRef<Map<string, TimelineItem[]>>(new Map());
  const detailRequestRef = useRef(0);
  const historyRequestRef = useRef(0);

  const pushSystem = useCallback(
    (text: string) => {
      setTimeline((current) => [
        ...current,
        createTimelineItem({ role: "system", text }),
      ]);
    },
    [setTimeline]
  );

  const pushChat = useCallback(
    (message: Partial<ChatMessagePayload>) => {
      const currentChannelId = selectedChannelRef.current;
      if (message.channelId && message.channelId !== currentChannelId) {
        return;
      }

      const messageId = message.messageId;
      const messageDisplayName = message.displayName || "未知用户";
      const sentAt = message.sentAt ? new Date(message.sentAt) : undefined;
      const role = messageDisplayName === displayName ? "me" : "user";

      const newItem = createTimelineItem({
        role,
        displayName: messageDisplayName,
        text: message.content || "",
        messageId,
        time: sentAt ? nowLabel(sentAt) : undefined,
        deliveryStatus: role === "me" ? "delivered" : undefined,
      });

      setTimeline((current) => {
        if (messageId) {
          const existingIndex = current.findIndex(
            (item) => item.messageId === messageId
          );
          if (existingIndex >= 0) {
            return current.map((item, index) =>
              index === existingIndex
                ? {
                    ...item,
                    deliveryStatus:
                      role === "me" ? "delivered" : item.deliveryStatus,
                  }
                : item
            );
          }
        }

        return [...current, newItem];
      });
    },
    [displayName, setTimeline]
  );

  const refreshChannelDetail = useCallback(
    async (
      targetChannelId = selectedChannelId,
      targetUserId = currentUser?.id || ""
    ) => {
      const requestId = ++detailRequestRef.current;

      if (!targetChannelId || !targetUserId) {
        setActiveChannelDetail(null);
        return;
      }

      setLoadingChannelDetail(true);
      try {
        const detail = await fetchChannelDetail(targetChannelId, targetUserId);
        if (requestId === detailRequestRef.current) {
          setActiveChannelDetail(detail);
        }
      } catch {
        if (requestId === detailRequestRef.current) {
          setActiveChannelDetail(null);
        }
      } finally {
        if (requestId === detailRequestRef.current) {
          setLoadingChannelDetail(false);
        }
      }
    },
    [
      currentUser?.id,
      selectedChannelId,
      setActiveChannelDetail,
      setLoadingChannelDetail,
    ]
  );

  const loadRecentMessages = useCallback(
    async (targetChannelId = selectedChannelId, targetUserId = currentUser?.id || "") => {
      const requestId = ++historyRequestRef.current;

      if (!targetChannelId || !targetUserId || !currentUser) {
        setTimeline([]);
        return;
      }

      try {
        const messages = await fetchChannelMessages(targetChannelId, targetUserId, { limit: 50 });
        if (requestId !== historyRequestRef.current) {
          return;
        }

        const historyItems = messages.map((message) =>
          chatMessageToTimelineItem(message, currentUser.id, displayName)
        );
        channelTimelinesRef.current.set(targetChannelId, historyItems);
        setTimeline((current) => mergeTimelines(historyItems, current));
      } catch {
        if (requestId === historyRequestRef.current) {
          pushSystem("历史消息加载失败。");
        }
      }
    },
    [currentUser, displayName, pushSystem, selectedChannelId, setTimeline]
  );

  const refreshChannels = useCallback(
    async (
      targetUserId = currentUser?.id || "",
      preferredChannelId = selectedChannelRef.current
    ) => {
      if (!targetUserId) {
        return "";
      }

      setLoadingChannels(true);
      setLobbyError("");
      try {
        const nextChannels = await fetchChannels(targetUserId);
        const nextChannelId = nextChannels.some(
          (channel) => channel.id === preferredChannelId
        )
          ? preferredChannelId
          : "";
        setChannels(nextChannels);
        setUnreadCounts((current) => {
          const next = { ...current };
          for (const channel of nextChannels) {
            next[channel.id] = channel.unreadCount;
          }
          return next;
        });
        setChannelId(nextChannelId);
        return nextChannelId;
      } catch {
        setChannels([]);
        setLobbyError("频道加载失败");
        return "";
      } finally {
        setLoadingChannels(false);
      }
    },
    [
      currentUser?.id,
      setChannelId,
      setChannels,
      setLoadingChannels,
      setLobbyError,
      setUnreadCounts,
    ]
  );

  const refreshLobby = useCallback(async () => {
    if (!currentUser) {
      return;
    }

    const preferredChannelId = selectedChannelRef.current || selectedChannelId;
    const nextChannelId = await refreshChannels(currentUser.id, preferredChannelId);
    await Promise.all([
      refreshChannelDetail(nextChannelId, currentUser.id),
      loadRecentMessages(nextChannelId, currentUser.id),
    ]);
  }, [currentUser, loadRecentMessages, refreshChannelDetail, refreshChannels, selectedChannelId]);

  const handleServerMessage = useCallback(
    (raw: string) => {
      let message: Partial<ChatMessagePayload>;

      try {
        message = JSON.parse(raw) as Partial<ChatMessagePayload>;
      } catch {
        pushSystem("收到无法解析的消息。");
        return;
      }

      switch (message.type) {
        case "USER_CHAT":
          pushChat(message);
          break;
        case "MESSAGE_ACK":
          setTimeline((current) => {
            const pendingIndex = current.findIndex(
              (item) => item.role === "me" && item.deliveryStatus === "sending"
            );
            if (pendingIndex < 0) {
              return current;
            }
            return current.map((item, index) =>
              index === pendingIndex
                ? {
                    ...item,
                    messageId: message.messageId,
                    deliveryStatus:
                      message.content === "ACCEPTED" ? "accepted" : "failed",
                  }
                : item
            );
          });
          break;
        case "UNREAD_CHANGED":
          if (message.channelId && message.channelId !== selectedChannelRef.current) {
            const increment = Number.parseInt(message.content || "1", 10) || 1;
            setChannels((current) =>
              current.map((channel) =>
                channel.id === message.channelId
                  ? { ...channel, unreadCount: channel.unreadCount + increment }
                  : channel
              )
            );
            setUnreadCounts((current) => ({
              ...current,
              [message.channelId as string]: (current[message.channelId as string] || 0) + increment,
            }));
          }
          break;
        case "USER_JOIN":
        case "USER_LEAVE":
          break;
        default:
          pushSystem("收到未知消息类型。");
          break;
      }

      refreshChannelDetail();
    },
    [pushChat, pushSystem, refreshChannelDetail, setTimeline, setUnreadCounts]
  );

  const sendChannelViewChanged = useCallback(
    (targetChannelId: string) => {
      if (!currentUser || !displayName || !targetChannelId) {
        return;
      }

      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        return;
      }

      if (socketChannelRef.current === targetChannelId) {
        return;
      }

      socketChannelRef.current = targetChannelId;
      socket.send(
        JSON.stringify({
          type: "CHANNEL_VIEW_CHANGED",
          displayName,
          channelId: targetChannelId,
          content: "切换当前查看频道",
          userId: currentUser.id,
        } satisfies ChatMessagePayload)
      );
      refreshChannelDetail(targetChannelId, currentUser.id);
      setChannels((current) =>
        current.map((channel) =>
          channel.id === targetChannelId ? { ...channel, unreadCount: 0 } : channel
        )
      );
      setUnreadCounts((current) => ({ ...current, [targetChannelId]: 0 }));
    },
    [currentUser, displayName, refreshChannelDetail, setChannels, setUnreadCounts]
  );

  const connectWorkspace = useCallback(() => {
    if (!currentUser || !displayName) {
      return;
    }

    const activeSocket = socketRef.current;
    const socketIsConnecting = activeSocket?.readyState === WebSocket.CONNECTING;
    const socketIsOpen = activeSocket?.readyState === WebSocket.OPEN;

    if (socketIsOpen) {
      setStatus("connected");
      return;
    }

    if (socketIsConnecting) {
      setStatus("connecting");
      return;
    }

    setStatus("connecting");
    const token = getToken();
    const wsTarget = token ? `${wsUrl}?token=${encodeURIComponent(token)}` : wsUrl;
    const socket = new WebSocket(wsTarget);
    socketRef.current = socket;
    socketChannelRef.current = "";

    socket.onopen = () => {
      if (socketRef.current !== socket) {
        socket.close();
        return;
      }

      setStatus("connected");
      socket.send(
        JSON.stringify({
          type: "WORKSPACE_JOIN",
          displayName,
          content: "进入 workspace",
          userId: currentUser.id,
        } satisfies ChatMessagePayload)
      );

      const currentChannelId = selectedChannelRef.current;
      if (currentChannelId) {
        socketChannelRef.current = currentChannelId;
        socket.send(
          JSON.stringify({
            type: "CHANNEL_VIEW_CHANGED",
            displayName,
            channelId: currentChannelId,
            content: "切换当前查看频道",
            userId: currentUser.id,
          } satisfies ChatMessagePayload)
        );
        refreshChannelDetail(currentChannelId, currentUser.id);
      }
    };

    socket.onmessage = (event) => {
      if (socketRef.current === socket) {
        handleServerMessage(event.data as string);
      }
    };

    socket.onerror = () => {
      if (socketRef.current === socket) {
        pushSystem("连接出错，请检查服务状态或地址。");
      }
    };

    socket.onclose = () => {
      if (socketRef.current !== socket) {
        return;
      }
      const lastChannelId = socketChannelRef.current;
      socketRef.current = null;
      socketChannelRef.current = "";
      setStatus("idle");
      pushSystem("连接已关闭。");
      if (lastChannelId) {
        refreshChannelDetail(lastChannelId, currentUser.id);
      }
    };
  }, [
    currentUser,
    displayName,
    handleServerMessage,
    pushSystem,
    refreshChannelDetail,
    setStatus,
  ]);

  const closeSocket = useCallback(() => {
    const socket = socketRef.current;
    socketRef.current = null;
    socketChannelRef.current = "";
    setStatus("idle");

    if (socket && socket.readyState !== WebSocket.CLOSED) {
      socket.close();
    }
  }, [setStatus]);

  const sendChat = useCallback(() => {
    const socket = socketRef.current;
    if (
      !canSend ||
      !currentUser ||
      !socket ||
      socket.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    const text = draft.trim();
    setTimeline((current) => [
      ...current,
      createTimelineItem({
        role: "me",
        displayName,
        text,
        deliveryStatus: "sending",
      }),
    ]);

    socket.send(
      JSON.stringify({
        type: "USER_CHAT",
        displayName,
        channelId: selectedChannelId,
        content: text,
      } satisfies ChatMessagePayload)
    );
    setDraft("");
  }, [
    canSend,
    currentUser,
    displayName,
    draft,
    selectedChannelId,
    setDraft,
    setTimeline,
  ]);

  const pickChannel = useCallback(
    (targetChannelId: string) => {
      if (targetChannelId === selectedChannelId) {
        return;
      }
      selectedChannelRef.current = targetChannelId;
      setTimeline((current) => {
        if (selectedChannelId) {
          channelTimelinesRef.current.set(selectedChannelId, current);
        }
        return channelTimelinesRef.current.get(targetChannelId) || [];
      });
      setActiveChannelDetail(null);
      setChannelId(targetChannelId);
      refreshChannelDetail(targetChannelId);
      loadRecentMessages(targetChannelId);
      sendChannelViewChanged(targetChannelId);
    },
    [
      loadRecentMessages,
      refreshChannelDetail,
      selectedChannelId,
      sendChannelViewChanged,
      setActiveChannelDetail,
      setChannelId,
      setTimeline,
    ]
  );

  useEffect(() => {
    if (!initialChannelId) {
      return;
    }

    selectedChannelRef.current = initialChannelId;
    setChannelId(initialChannelId);
  }, [initialChannelId, setChannelId]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    refreshLobby();
    connectWorkspace();
    const pollingTimer = window.setInterval(
      () => refreshChannelDetail(selectedChannelRef.current, currentUser.id),
      5000
    );
    return () => window.clearInterval(pollingTimer);
  }, [currentUser?.id]);

  useEffect(() => {
    selectedChannelRef.current = selectedChannelId;
    if (currentUser && selectedChannelId) {
      sendChannelViewChanged(selectedChannelId);
    }
  }, [currentUser, selectedChannelId, sendChannelViewChanged]);

  useEffect(() => closeSocket, [closeSocket]);

  return {
    pickChannel,
    refreshLobby,
    sendChat,
  };
}
