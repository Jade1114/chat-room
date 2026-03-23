<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';

const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws/chat';
const username = ref('');
const draft = ref('');
const socket = ref(null);
const status = ref('idle');
const timeline = ref([]);

const isConnected = computed(() => status.value === 'connected');
const canConnect = computed(() => !isConnected.value && username.value.trim().length > 0);
const canSend = computed(() => isConnected.value && draft.value.trim().length > 0);

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
}

function connect() {
  const trimmed = username.value.trim();
  if (!trimmed) {
    pushSystem('请输入昵称后再连接。');
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
    pushSystem(`已连接到聊天室（${wsUrl}）`);
    ws.send(
      JSON.stringify({
        type: 'USER_JOIN',
        sender: trimmed,
        content: '进入了当前频道'
      })
    );
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

onBeforeUnmount(() => {
  if (socket.value) {
    socket.value.close();
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
          <h1>Chat Room</h1>
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

      <section class="control-panel">
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

        <div class="button-group">
          <button class="btn btn-primary" :disabled="!canConnect" @click="connect">连接</button>
          <button class="btn btn-ghost" :disabled="!isConnected" @click="disconnect">断开</button>
        </div>
      </section>

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
          还没有消息。先连接，然后发第一条吧。
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
    </main>
  </div>
</template>
