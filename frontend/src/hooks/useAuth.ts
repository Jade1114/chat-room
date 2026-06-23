import { useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { getToken, setToken, clearToken } from '../lib/authApi';
import { currentUserAtom, channelIdAtom, channelsAtom, activeChannelDetailAtom, timelineAtom, draftAtom, statusAtom, lobbyErrorAtom } from '../state/chatAtoms';
import { tokenAtom } from '../state/authAtoms';
import type { CurrentUser } from '../types/chat';

interface AuthUser {
  token: string;
  userId: string;
  displayName: string;
  role: string;
}

export function useAuth() {
  const setCurrentUser = useSetAtom(currentUserAtom);
  const setTokenAtom = useSetAtom(tokenAtom);
  const setChannelId = useSetAtom(channelIdAtom);
  const setChannels = useSetAtom(channelsAtom);
  const setActiveChannelDetail = useSetAtom(activeChannelDetailAtom);
  const setTimeline = useSetAtom(timelineAtom);
  const setDraft = useSetAtom(draftAtom);
  const setStatus = useSetAtom(statusAtom);
  const setLobbyError = useSetAtom(lobbyErrorAtom);

  const applyAuth = useCallback((auth: AuthUser) => {
    setToken(auth.token);
    setTokenAtom(auth.token);
    setCurrentUser({
      id: auth.userId,
      displayName: auth.displayName,
      role: auth.role as CurrentUser['role'],
      schoolId: '',
      departmentId: null,
      classId: null,
      courseIds: [],
    });
  }, [setTokenAtom, setCurrentUser]);

  const login = useCallback(async (username: string, password: string): Promise<AuthUser> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: '登录失败' }));
      throw new Error(err.error || '登录失败');
    }
    return res.json();
  }, []);

  const register = useCallback(async (username: string, displayName: string, password: string): Promise<AuthUser> => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, displayName, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: '注册失败' }));
      throw new Error(err.error || '注册失败');
    }
    return res.json();
  }, []);

  const devLogin = useCallback(async (userId: string): Promise<AuthUser> => {
    const res = await fetch('/api/auth/dev-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Dev 登录失败' }));
      throw new Error(err.error || 'Dev 登录失败');
    }
    return res.json();
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenAtom(null);
    setCurrentUser(null);
    setChannelId('');
    setChannels([]);
    setActiveChannelDetail(null);
    setTimeline([]);
    setDraft('');
    setStatus('idle');
    setLobbyError('');
  }, [setTokenAtom, setCurrentUser, setChannelId, setChannels, setActiveChannelDetail, setTimeline, setDraft, setStatus, setLobbyError]);

  const restoreSession = useCallback(async (): Promise<CurrentUser | null> => {
    const token = getToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!res.ok) return null;
      const user = await res.json();
      if (!user || !user.id) return null;
      user.courseIds = user.courseIds || [];
      setCurrentUser(user);
      return user as CurrentUser;
    } catch {
      return null;
    }
  }, [setCurrentUser]);

  const fetchMockUsers = useCallback(async (): Promise<CurrentUser[]> => {
    try {
      const res = await fetch('/api/mock-users');
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  }, []);

  return { login, register, devLogin, logout, restoreSession, applyAuth, fetchMockUsers };
}
