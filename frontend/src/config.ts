const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const configuredWsUrl = import.meta.env.VITE_WS_URL;

function defaultWsUrl() {
  if (import.meta.env.DEV) {
    return 'ws://localhost:8080/ws/chat';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/chat`;
}

export const apiBaseUrl = configuredApiBaseUrl ?? (import.meta.env.DEV ? 'http://localhost:8080' : '');
export const wsUrl = configuredWsUrl || defaultWsUrl();
