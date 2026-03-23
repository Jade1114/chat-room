<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws/chat';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const username = ref('');
const roomId = ref('');
const draft = ref('');
const socket = ref(null);
const status = ref('idle');
const timeline = ref([]);
const rooms = ref([]);
const activeRoomDetail = ref(null);
const loadingRooms = ref(false);
const loadingDetail = ref(false);

let pollingTimer = null;

const isConnected = computed(() => status.value === 'connected');
const canConnect = computed(() => {
  return !isConnected.value && username.value.trim().length > 0 && roomId.value.trim().length > 0;
});
const canSend = computed(() => isConnected.value && draft.value.trim().length > 0);
const selectedRoom = computed(() => roomId.value.trim());

function nowLabel() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function pushSystem(text) {
  timeline.value.push({
    id: `${Date.now()}-${Math.random()}`,
    role: 'system',
    text,
    time: nowLabel()
  });
}

function pushChat(sender, text) {
  timeline.value.push({
    id: `${Date.now()}-${Math.random()}`,
    role: sender === username.value.trim() ? 'me' : 'user',
    sender,
    text,
    time: nowLabel()
  });
}

function pickRoom(targetRoomId) {
  if (isConnected.value) {
    return;
  }
  roomId.value = targetRoomId;
  refreshRoomDetail(targetRoomId);
}

async function refreshRooms() {
  loadingRooms.value = true;
  try {
    const response = await fetch(`${apiBaseUrl}/api/rooms`);
    if (!response.ok) {
      throw new Error(`rooms status ${response.status}`);
    }
    rooms.value = await response.json();
    if (!selectedRoom.value && rooms.value.length > 0) {
      roomId.value = rooms.value[0].roomId;
    }
  } catch {
    rooms.value = [];
  } finally {
    loadingRooms.value = false;
  }
}

async function refreshRoomDetail(targetRoomId = selectedRoom.value) {
  if (!targetRoomId) {
    activeRoomDetail.value = null;
    return;
  }

  loadingDetail.value = true;
  try {
    const response = await fetch(`${apiBaseUrl}/api/rooms/${encodeURIComponent(targetRoomId)}`);
    if (!response.ok) {
      throw new Error(`room detail status ${response.status}`);
    }
    activeRoomDetail.value = await response.json();
  } catch {
    activeRoomDetail.value = null;
  } finally {
    loadingDetail.value = false;
  }
}

async function refreshLobby() {
  await refreshRooms();
  await refreshRoomDetail();
}

function handleServerMessage(raw) {
  let message;
  try {
    message = JSON.parse(raw);
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
}

function connect() {
  const trimmedName = username.value.trim();
  const trimmedRoom = roomId.value.trim();

  if (!trimmedName || !trimmedRoom) {
    pushSystem('请输入昵称和房间号后再连接。');
    return;
  }

  if (socket.value && socket.value.readyState === WebSocket.OPEN) {
    return;
  }

  status.value = 'connecting';
  const ws = new WebSocket(wsUrl);
  socket.value = ws;

  ws.onopen = () => {
    status.value = 'connected';
    pushSystem(`已连接到房间 ${trimmedRoom}`);
    ws.send(
      JSON.stringify({
        type: 'USER_JOIN',
        sender: trimmedName,
        roomId: trimmedRoom,
        content: '进入了当前频道'
      })
    );
    refreshLobby();
  };

  ws.onmessage = (event) => {
    handleServerMessage(event.data);
  };

  ws.onerror = () => {
    pushSystem('连接出错，请检查服务状态或地址。');
  };

  ws.onclose = () => {
    status.value = 'idle';
    pushSystem('连接已关闭。');
    socket.value = null;
    refreshLobby();
  };
}

function disconnect() {
  if (socket.value) {
    socket.value.close();
  }
}

function sendChat() {
  if (!canSend.value || !socket.value) {
    return;
  }

  const text = draft.value.trim();
  socket.value.send(
    JSON.stringify({
      type: 'USER_CHAT',
      sender: username.value.trim(),
      roomId: roomId.value.trim(),
      content: text
    })
  );
  draft.value = '';
}

function onSendEnter(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendChat();
  }
}

onMounted(() => {
  refreshLobby();
  pollingTimer = window.setInterval(refreshLobby, 5000);
});

onBeforeUnmount(() => {
  if (socket.value) {
    socket.value.close();
  }
  if (pollingTimer) {
    window.clearInterval(pollingTimer);
  }
});
</script>

<template>
  <div class="page-bg">
    <div class="blob blob-left"></div>
    <div class="blob blob-right"></div>

    <main class="chat-shell">
      <header class="top-bar">
        <div>
          <p class="eyebrow">Vue Frontend</p>
          <h1>Room Chat</h1>
        </div>
        <div class="status-pill" :class="status">
          <span class="dot"></span>
          <span>
            {{
              status === 'connected'
                ? '已连接'
                : status === 'connecting'
                  ? '连接中'
                  : '未连接'
            }}
          </span>
        </div>
      </header>

      <section class="layout">
        <aside class="sidebar">
          <div class="panel">
            <h2>连接信息</h2>
            <label class="field">
              <span>昵称</span>
              <input
                v-model="username"
                type="text"
                maxlength="20"
                placeholder="例如：yuy"
                :disabled="isConnected"
              />
            </label>
            <label class="field">
              <span>房间号</span>
              <input
                v-model="roomId"
                type="text"
                maxlength="10"
                placeholder="例如：room-1"
                :disabled="isConnected"
                @blur="refreshRoomDetail(roomId.trim())"
              />
            </label>
            <div class="button-group">
              <button class="btn btn-primary" :disabled="!canConnect" @click="connect">连接</button>
              <button class="btn btn-ghost" :disabled="!isConnected" @click="disconnect">断开</button>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head">
              <h2>房间大厅</h2>
              <button class="tiny-btn" @click="refreshLobby">刷新</button>
            </div>
            <div class="room-list">
              <p v-if="loadingRooms" class="muted">正在加载房间...</p>
              <p v-else-if="rooms.length === 0" class="muted">当前没有在线房间</p>
              <button
                v-for="room in rooms"
                :key="room.roomId"
                class="room-item"
                :class="{ active: room.roomId === selectedRoom }"
                @click="pickRoom(room.roomId)"
              >
                <span># {{ room.roomId }}</span>
                <strong>{{ room.onlineCount }} 人</strong>
              </button>
            </div>
          </div>

          <div class="panel">
            <h2>房间详情</h2>
            <p v-if="loadingDetail" class="muted">正在获取详情...</p>
            <p v-else-if="!activeRoomDetail" class="muted">暂无详情（可先选择房间）</p>
            <template v-else>
              <p class="muted">房间：# {{ activeRoomDetail.roomId }}</p>
              <p class="muted">在线：{{ activeRoomDetail.onlineCount }} 人</p>
              <ul class="member-list">
                <li v-for="name in activeRoomDetail.usernames" :key="name">{{ name }}</li>
              </ul>
            </template>
          </div>
        </aside>

        <section class="chat-area">
          <section class="timeline" aria-live="polite">
            <article
              v-for="item in timeline"
              :key="item.id"
              class="message"
              :class="`message-${item.role}`"
            >
              <div class="meta">
                <span class="name">{{ item.role === 'system' ? '系统' : item.sender }}</span>
                <span class="time">{{ item.time }}</span>
              </div>
              <p>{{ item.text }}</p>
            </article>

            <p v-if="timeline.length === 0" class="empty-state">
              还没有消息。先进入一个房间然后聊起来吧。
            </p>
          </section>

          <footer class="composer">
            <textarea
              v-model="draft"
              placeholder="输入消息，按 Enter 发送，Shift + Enter 换行"
              maxlength="100"
              :disabled="!isConnected"
              @keydown="onSendEnter"
            ></textarea>
            <button class="btn btn-primary send" :disabled="!canSend" @click="sendChat">发送</button>
          </footer>
        </section>
      </section>
    </main>
  </div>
</template>
