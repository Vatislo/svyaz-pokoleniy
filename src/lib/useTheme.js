import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'portal-theme';

/** Системная тема пользователя ('light' | 'dark'). */
function systemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStored() {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'dark' || v === 'light' ? v : null;
  } catch {
    return null;
  }
}

/**
 * Управляет светлой/тёмной темой.
 * - Выбор пользователя сохраняется в localStorage;
 * - при первом заходе берётся системная настройка prefers-color-scheme;
 * - тема применяется как data-theme на <html>;
 * - смена системной темы не переопределяет явный выбор пользователя.
 *
 * @returns {{ theme: 'light'|'dark', toggle: () => void, setTheme: (t: 'light'|'dark') => void }}
 */
export function useTheme() {
  const [theme, setThemeState] = useState(() => readStored() || systemTheme());

  // Применяем атрибут к <html> — так тема видна всем компонентам через CSS-переменные.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    return undefined;
  }, [theme]);

  // Если пользователь ничего не выбирал — следуем за системной темой на лету.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    if (readStored()) return undefined;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setThemeState(e.matches ? 'dark' : 'light');
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const setTheme = useCallback((next) => {
    if (next !== 'light' && next !== 'dark') return;
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* приватный режим — просто продолжаем без сохранения */
    }
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { theme, toggle, setTheme };
}
