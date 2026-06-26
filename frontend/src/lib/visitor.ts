const VISITOR_ID_KEY = 'chat_room_visitor_id';

export function getVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_ID_KEY);
    if (existing) return existing;
    const generated = `vis-${crypto.randomUUID()}`;
    localStorage.setItem(VISITOR_ID_KEY, generated);
    return generated;
  } catch {
    return `vis-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
