import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { wsUrl } from "../config";
import { fetchChannelDetail, fetchChannels } from "../lib/chatApi";
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

export function useChatRoom() {
  const [draft, setDraft] = useAtom(draftAtom);
  const selectedChannelId = useAtomValue(selectedChannelIdAtom);
  const displayName = useAtomValue(displayNameAtom);
  const currentUser = useAtomValue(currentUserAtom);
  const canSend = useAtomValue(canSendAtom);
  const setStatus = useSetAtom(statusAtom);
  const setTimeline = useSetAtom(timelineAtom);
  const setChannels = useSetAtom(channelsAtom);
  const setChannelId = useSetAtom(channelIdAtom);
  const setActiveChannelDetail = useSetAtom(activeChannelDetailAtom);
  const setLoadingChannels = useSetAtom(loadingChannelsAtom);
  const setLoadingChannelDetail = useSetAtom(loadingChannelDetailAtom);
  const setLobbyError = useSetAtom(lobbyErrorAtom);
  const socketRef = useRef<WebSocket | null>(null);
  const socketChannelRef = useRef("");
  const detailRequestRef = useRef(0);

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
      const messageId = message.messageId;
      const sender = message.sender || "未知用户";
      const sentAt = message.sentAt ? new Date(message.sentAt) : undefined;
      const role = sender === displayName ? "me" : "user";

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

        return [
          ...current,
          createTimelineItem({
            role,
            sender,
            text: message.content || "",
            messageId,
            time: sentAt ? nowLabel(sentAt) : undefined,
            deliveryStatus: role === "me" ? "delivered" : undefined,
          }),
        ];
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

  const refreshChannels = useCallback(
    async (targetUserId = currentUser?.id || "") => {
      if (!targetUserId) {
        return "";
      }

      setLoadingChannels(true);
      setLobbyError("");
      try {
        const nextChannels = await fetchChannels(targetUserId);
        const nextChannelId = nextChannels.some(
          (channel) => channel.id === selectedChannelId
        )
          ? selectedChannelId
          : nextChannels[0]?.id || "";
        setChannels(nextChannels);
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
      selectedChannelId,
      setChannelId,
      setChannels,
      setLoadingChannels,
      setLobbyError,
    ]
  );

  const refreshLobby = useCallback(async () => {
    if (!currentUser) {
      return;
    }

    const nextChannelId = await refreshChannels(currentUser.id);
    await refreshChannelDetail(nextChannelId, currentUser.id);
  }, [currentUser, refreshChannelDetail, refreshChannels]);

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
        case "USER_JOIN":
        case "USER_LEAVE":
          pushSystem(
            `${message.sender || "未知用户"} ${message.content || ""}`.trim()
          );
          break;
        default:
          pushSystem("收到未知消息类型。");
          break;
      }

      refreshChannelDetail();
    },
    [pushChat, pushSystem, refreshChannelDetail, setTimeline]
  );

  const connect = useCallback(
    (targetChannelId: string) => {
      if (!currentUser || !displayName || !targetChannelId) {
        return;
      }

      const activeSocket = socketRef.current;
      const socketIsActive =
        activeSocket?.readyState === WebSocket.CONNECTING ||
        activeSocket?.readyState === WebSocket.OPEN;
      if (socketIsActive && socketChannelRef.current === targetChannelId) {
        return;
      }

      if (activeSocket) {
        socketRef.current = null;
        socketChannelRef.current = "";
        activeSocket.close();
      }

      setStatus("connecting");
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      socketChannelRef.current = targetChannelId;

      socket.onopen = () => {
        if (socketRef.current !== socket) {
          socket.close();
          return;
        }

        setStatus("connected");
        pushSystem(`已进入 ${targetChannelId}`);
        socket.send(
          JSON.stringify({
            type: "USER_JOIN",
            sender: displayName,
            roomId: targetChannelId,
            content: "进入了当前频道",
            userId: currentUser.id,
          } satisfies ChatMessagePayload)
        );
        refreshChannelDetail(targetChannelId, currentUser.id);
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
        socketRef.current = null;
        socketChannelRef.current = "";
        setStatus("idle");
        pushSystem("连接已关闭。");
        refreshChannelDetail(targetChannelId, currentUser.id);
      };
    },
    [
      currentUser,
      displayName,
      handleServerMessage,
      pushSystem,
      refreshChannelDetail,
      setStatus,
    ]
  );

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
        sender: displayName,
        text,
        deliveryStatus: "sending",
      }),
    ]);

    socket.send(
      JSON.stringify({
        type: "USER_CHAT",
        sender: displayName,
        roomId: selectedChannelId,
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
      setTimeline([]);
      setActiveChannelDetail(null);
      setChannelId(targetChannelId);
      refreshChannelDetail(targetChannelId);
    },
    [
      refreshChannelDetail,
      selectedChannelId,
      setActiveChannelDetail,
      setChannelId,
      setTimeline,
    ]
  );

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    refreshLobby();
    const pollingTimer = window.setInterval(refreshLobby, 5000);
    return () => window.clearInterval(pollingTimer);
  }, [currentUser, refreshLobby]);

  useEffect(() => {
    if (currentUser && selectedChannelId) {
      connect(selectedChannelId);
    }
  }, [connect, currentUser, selectedChannelId]);

  useEffect(() => closeSocket, [closeSocket]);

  return {
    pickChannel,
    refreshLobby,
    sendChat,
  };
}
