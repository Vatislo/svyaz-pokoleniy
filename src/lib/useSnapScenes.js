import { useCallback, useEffect, useRef, useState } from 'react'

const LOCKOUT_MS = 400
// Суммарный «прокрученный» пиксель, после которого переключается сцена.
// Копим значения: у трекпадов и некоторых колёс каждый отдельный event
// слишком маленький, из-за чего сцены не переключались вообще.
const WHEEL_STEP_PX = 45
// Если события идут с паузой больше этого, начинаем копить заново.
const ACCUM_RESET_MS = 200
const LINE_HEIGHT_PX = 16

// Колесо может отдавать пиксели (deltaMode 0), строки (1) или страницы (2).
function toPixels(deltaY, deltaMode) {
  if (deltaMode === 1) return deltaY * LINE_HEIGHT_PX
  if (deltaMode === 2) return deltaY * window.innerHeight
  return deltaY
}

// Пока открыт модальный диалог (Radix гасит клики на body), не перехватываем скролл.
function modalIsOpen() {
  return document.body.style.pointerEvents === 'none'
}

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  )
}

export function useSnapScenes(count) {
  const [active, setActive] = useState(0)
  const [enabled, setEnabled] = useState(false)
  const lockRef = useRef(0)
  const accumRef = useRef(0)
  const lastWheelRef = useRef(0)
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
    (delta, force = false) => {
      const now = Date.now()
      if (!force && now - lockRef.current < LOCKOUT_MS) {
        accumRef.current = 0
        return
      }
      lockRef.current = now
      accumRef.current = 0
      setActive((prev) => Math.max(0, Math.min(count - 1, prev + delta)))
    },
    [count],
  )

  useEffect(() => {
    if (!enabled) return undefined

    const onWheel = (e) => {
      if (modalIsOpen()) return

      const delta = toPixels(e.deltaY, e.deltaMode)
      if (!delta) return

      // Не ломаем внутренний скролл сцены: пока у сцены есть куда скроллить,
      // отдаём событие браузеру и сцену не переключаем.
      let el = e.target instanceof Element ? e.target : null
      while (el) {
        if (el.scrollHeight > el.clientHeight + 1) {
          const style = window.getComputedStyle(el)
          if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
            const atTop = el.scrollTop <= 0
            const atBottom =
              el.scrollTop + el.clientHeight >= el.scrollHeight - 1
            if ((delta < 0 && !atTop) || (delta > 0 && !atBottom)) return
          }
        }
        el = el.parentElement
      }

      // Копим прокрутку: порог сравниваем с суммой, а не с одним событием.
      const now = Date.now()
      if (now - lastWheelRef.current > ACCUM_RESET_MS) accumRef.current = 0
      lastWheelRef.current = now
      accumRef.current += delta

      // Прокрутку страницы «снап»-режима не отдаём браузеру, иначе сцены
      // начинают уезжать из-под шапки.
      e.preventDefault()

      if (Math.abs(accumRef.current) < WHEEL_STEP_PX) return
      step(Math.sign(accumRef.current))
    }

    const onKeyDown = (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
      if (modalIsOpen() || isEditableTarget(e.target)) return

      let dir = 0
      if (e.key === 'ArrowDown' || e.key === 'PageDown') dir = 1
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') dir = -1
      else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault()
        go(e.key === 'Home' ? 0 : count - 1)
        return
      } else return

      e.preventDefault()
      step(dir, true)
    }

    const onTouchStart = (e) => {
      touchStartRef.current = e.touches[0].clientY
    }
    const onTouchEnd = (e) => {
      if (touchStartRef.current == null) return
      const delta = touchStartRef.current - e.changedTouches[0].clientY
      touchStartRef.current = null
      if (Math.abs(delta) < 48) return
      step(Math.sign(delta), true)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [enabled, step, go, count])

  return { active, go, enabled }
}
