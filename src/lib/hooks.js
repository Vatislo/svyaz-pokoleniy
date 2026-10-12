import { useEffect, useState } from 'react';

function getMatches(query) {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(query).matches;
}

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => getMatches(query));

  // Синхронизируем состояние, только если строка запроса реально изменилась.
  // Выполняется во время рендера (паттерн React «adjusting state when props change»),
  // а не в эффекте — без лишних циклов рендера.
  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setMatches(getMatches(query));
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mql = window.matchMedia(query);
    // Обработчик — внешняя система (изменение настроек ОС), setState здесь допустим.
    const onChange = (e) => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

function parseHash(hash) {
  const raw = (hash || '').replace(/^#/, '');
  const [pathPart, queryPart] = raw.split('?');
  const path = pathPart || '/';
  const query = new URLSearchParams(queryPart || '');
  return { path, query };
}

export function useHashRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route;
}
