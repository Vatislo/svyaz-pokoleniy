import { useCallback, useEffect, useRef, useState } from 'react'

const LOCKOUT_MS = 500
const MIN_DELTA = 12

export function useSnapScenes(count) {
  const [active, setActive] = useState(0)
  const [enabled, setEnabled] = useState(false)
  const lockRef = useRef(0)
  const touchStartRef = useRef(null)

  useEffect(() => {
    const mqDesktop = window.matchMedia('(min-width: 900px)')
    const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)')

    const update = () => setEnabled(mqDesktop.matches && !mqReduced.matches)
    update()
    mqDesktop.addEventListener('change', update)
    mqReduced.addEventListener('change', update)
    return () => {
      mqDesktop.removeEventListener('change', update)
      mqReduced.removeEventListener('change', update)
    }
  }, [])

  const go = useCallback(
    (index) => {
      setActive(Math.max(0, Math.min(count - 1, index)))
    },
    [count],
  )

  const step = useCallback(
    (delta) => {
      const now = Date.now()
      if (now - lockRef.current < LOCKOUT_MS) return
      lockRef.current = now
      setActive((prev) => {
        const next = Math.max(0, Math.min(count - 1, prev + delta))
        return next
      })
    },
    [count],
  )

  useEffect(() => {
    if (!enabled) return undefined

    const onWheel = (e) => {
      const dir = Math.sign(e.deltaY)
      if (dir === 0) return
      if (Math.abs(e.deltaY) < MIN_DELTA) return

      // Не ломаем внутренний скролл сцены
      let el = e.target instanceof Element ? e.target : null
      while (el) {
        if (el.scrollHeight > el.clientHeight + 1) {
          const style = window.getComputedStyle(el)
          if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
            const atTop = el.scrollTop <= 0
            const atBottom =
              el.scrollTop + el.clientHeight >= el.scrollHeight - 1
            if ((dir < 0 && !atTop) || (dir > 0 && !atBottom)) return
          }
        }
        el = el.parentElement
      }

      e.preventDefault()
      step(dir)
    }

    const onTouchStart = (e) => {
      touchStartRef.current = e.touches[0].clientY
    }
    const onTouchEnd = (e) => {
      if (touchStartRef.current == null) return
      const delta = touchStartRef.current - e.changedTouches[0].clientY
      touchStartRef.current = null
      if (Math.abs(delta) < 48) return
      step(Math.sign(delta))
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [enabled, step])

  return { active, go, enabled }
}
