const LOCAL_SESSION_ID_KEY = 'do_together_local_session_id';

function createLocalSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `ls-${crypto.randomUUID()}`;
  }

  return `ls-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getLocalSessionId(): string {
  const existing = localStorage.getItem(LOCAL_SESSION_ID_KEY);
  if (existing) return existing;

  const id = createLocalSessionId();
  localStorage.setItem(LOCAL_SESSION_ID_KEY, id);
  return id;
}
