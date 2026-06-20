import { useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { fetchCurrentUser } from '../../lib/chatApi';
import { currentUserAtom, lobbyErrorAtom } from '../../state/chatAtoms';

export function useWorkspaceSession() {
  const setCurrentUser = useSetAtom(currentUserAtom);
  const setLobbyError = useSetAtom(lobbyErrorAtom);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      setLobbyError('');

      try {
        const user = await fetchCurrentUser();
        if (!cancelled) {
          setCurrentUser(user);
        }
      } catch {
        if (!cancelled) {
          setCurrentUser(null);
          setLobbyError('用户加载失败');
        }
      }
    }

    loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [setCurrentUser, setLobbyError]);
}
