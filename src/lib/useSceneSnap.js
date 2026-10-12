import { useCallback, useEffect, useRef, useState } from 'react';

const LOCK_MS = 750;
const WHEEL_THRESHOLD = 36;
const SWIPE_THRESHOLD = 56;

function normalizeDelta(e) {
  if (e.deltaMode === 1) return e.deltaY * 16;
  if (e.deltaMode === 2) return e.deltaY * window.innerHeight;
  return e.deltaY;
}

function findScrollableAncestor(start, boundary, dir) {
  let node = start instanceof Element ? start : null;
  while (node && node !== boundary) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    const canScroll =
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      node.scrollHeight > node.clientHeight + 1;
    if (canScroll) {
      const max = node.scrollHeight - node.clientHeight;
      if (dir > 0 && node.scrollTop < max - 1) return true;
      if (dir < 0 && node.scrollTop > 1) return true;
    }
    node = node.parentElement;
  }
  return false;
}

export function useSceneSnap(containerRef, count, { enabled }) {
  const [index, setIndexState] = useState(0);
  const lockRef = useRef(0);
  const accRef = useRef(0);
  const accDirRef = useRef(0);
  const touchRef = useRef(null);

  const setIndex = useCallback(
    (next) => {
      setIndexState((prev) => {
        const clamped = Math.max(0, Math.min(count - 1, next));
        if (clamped !== prev) lockRef.current = Date.now() + LOCK_MS;
        return clamped;
      });
    },
    [count],
  );

  const goTo = useCallback(
    (i) => {
      lockRef.current = Date.now() + LOCK_MS;
      setIndexState(Math.max(0, Math.min(count - 1, i)));
    },
    [count],
  );

  // Если число сцен изменилось (контент подгрузился), держим индекс в границах.
  // Синхронизация во время рендера (паттерн React «adjusting state when props change»),
  // без эффекта и лишних циклов рендера.
  const [prevCount, setPrevCount] = useState(count);
  if (count !== prevCount) {
    setPrevCount(count);
    setIndexState(Math.max(0, Math.min(count - 1, index)));
  }

  useEffect(() => {
    if (!enabled) return undefined;
    const el = containerRef.current;
    if (!el) return undefined;

    const onWheel = (e) => {
      const raw = normalizeDelta(e);
      if (Math.abs(raw) < 1) return;
      const dir = raw > 0 ? 1 : -1;

      if (findScrollableAncestor(e.target, el, dir)) return;

      const atTop = window.scrollY <= 1;
      if (dir > 0 && index >= count - 1) return;
      if (dir < 0 && !atTop) return;
      if (dir < 0 && index <= 0) return;

      e.preventDefault();

      const now = Date.now();
      if (now < lockRef.current) return;

      if (accDirRef.current !== dir) {
        accDirRef.current = dir;
        accRef.current = 0;
      }
      accRef.current += raw;
      if (Math.abs(accRef.current) < WHEEL_THRESHOLD) return;
      accRef.current = 0;
      setIndex(index + dir);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [enabled, containerRef, count, index, setIndex]);

  useEffect(() => {
    if (!enabled) return undefined;
    const el = containerRef.current;
    if (!el) return undefined;

    const onStart = (e) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      touchRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const onMove = (e) => {
      const start = touchRef.current;
      if (!start || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dy) < SWIPE_THRESHOLD || Math.abs(dy) < Math.abs(dx)) return;
      const dir = dy > 0 ? -1 : 1;
      const atTop = window.scrollY <= 1;
      if (dir > 0 && index >= count - 1) return;
      if (dir < 0 && !atTop) return;
      if (dir < 0 && index <= 0) return;
      if (findScrollableAncestor(e.target, el, dir)) return;
      if (e.cancelable) e.preventDefault();
    };

    const onEnd = (e) => {
      const start = touchRef.current;
      touchRef.current = null;
      if (!start) return;
      const touch = e.changedTouches && e.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dy) < SWIPE_THRESHOLD || Math.abs(dy) < Math.abs(dx)) return;
      const dir = dy > 0 ? -1 : 1;
      const now = Date.now();
      if (now < lockRef.current) return;
      setIndex(index + dir);
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
    };
  }, [enabled, containerRef, count, index, setIndex]);

  useEffect(() => {
    if (!enabled) return undefined;
    const el = containerRef.current;
    if (!el) return undefined;

    const onKeyDown = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      let next = null;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') next = index + 1;
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') next = index - 1;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = count - 1;
      if (next === null) return;
      e.preventDefault();
      setIndex(next);
    };

    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [enabled, containerRef, count, index, setIndex]);

  return { index, goTo };
}
