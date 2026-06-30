import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const storageKey = 'do-together-theme';

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark';
}

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function savedTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(storageKey);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

function resolveTheme(): Theme {
  return savedTheme() || systemTheme();
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function initializeTheme() {
  applyTheme(resolveTheme());
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => resolveTheme());

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    function syncSystemTheme() {
      if (!savedTheme()) {
        const nextTheme = systemTheme();
        applyTheme(nextTheme);
        setTheme(nextTheme);
      }
    }

    function syncStoredTheme(event: StorageEvent) {
      if (event.key !== storageKey) {
        return;
      }
      const nextTheme = isTheme(event.newValue) ? event.newValue : systemTheme();
      applyTheme(nextTheme);
      setTheme(nextTheme);
    }

    mediaQuery.addEventListener('change', syncSystemTheme);
    window.addEventListener('storage', syncStoredTheme);
    return () => {
      mediaQuery.removeEventListener('change', syncSystemTheme);
      window.removeEventListener('storage', syncStoredTheme);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(storageKey, nextTheme);
      } catch {
        // The active page still switches theme when storage is unavailable.
      }
      applyTheme(nextTheme);
      return nextTheme;
    });
  }, []);

  return { theme, toggleTheme };
}
