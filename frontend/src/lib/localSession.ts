const LOCAL_SESSION_ID_KEY = 'chat_room_local_session_id';

export function getLocalSessionId(): string {
  const existing = localStorage.getItem(LOCAL_SESSION_ID_KEY);
  if (existing) return existing;

  const id = `ls-${crypto.randomUUID()}`;
  localStorage.setItem(LOCAL_SESSION_ID_KEY, id);
  return id;
}
