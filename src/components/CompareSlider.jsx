import { useEffect, useRef, useState } from 'react'
import { cn } from 'cn'
import { SafeImage } from '@/components/SafeImage'
import content from '@/data/content.json'

export function CompareSlider({ thenImage, thenAlt, nowImage, nowAlt, compact = false }) {
  const [pos, setPos] = useState(50)
  const wrapRef = useRef(null)

  const updateFromPointer = (event) => {
    const bounds = wrapRef.current?.getBoundingClientRect()
    if (!bounds || bounds.width <= 0) return
    const next = ((event.clientX - bounds.left) / bounds.width) * 100
    setPos(Math.max(0, Math.min(100, next)))
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.target !== wrapRef.current) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setPos((p) => Math.max(0, p - 4))
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setPos((p) => Math.min(100, p + 4))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={wrapRef}
        tabIndex={0}
        role="group"
        aria-label={`${content.ui.then} / ${content.ui.now}`}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture?.(event.pointerId)
          updateFromPointer(event)
        }}
        onPointerMove={(event) => {
          if (event.buttons === 1 || event.pointerType === 'touch') updateFromPointer(event)
        }}
        className={cn(
          'relative w-full touch-pan-y overflow-hidden rounded-[14px] bg-dark shadow-card select-none',
          compact ? 'aspect-video' : 'aspect-[16/10]',
        )}
      >
        <SafeImage
          src={nowImage}
          alt={nowAlt}
          className="absolute inset-0 size-full"
          fallbackClassName="absolute inset-0"
        />
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <SafeImage
            src={thenImage}
            alt={thenAlt}
            className="absolute inset-0 size-full"
            fallbackClassName="absolute inset-0"
          />
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-white/90 shadow-[0_0_8px_rgba(0,0,0,0.45)]"
          style={{ left: `${pos}%` }}
          aria-hidden="true"
        >
          <span className="absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-graphite bg-white text-sm font-bold text-graphite">
            «»
          </span>
        </div>

        {/* Подписи с фиксированными цветами: в тёмной теме `text-stone`
            становится тёмным, и пиюли сливались с тёмными участками фото. */}
        <span className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-black/20 bg-white/90 px-3 py-1 text-[0.66rem] font-semibold tracking-[0.14em] text-[#1e1d1c] uppercase shadow-sm">
          {content.ui.then}
        </span>
        <span className="pointer-events-none absolute right-3 bottom-3 rounded-full border border-black/20 bg-white/90 px-3 py-1 text-[0.66rem] font-semibold tracking-[0.14em] text-[#1e1d1c] uppercase shadow-sm">
          {content.ui.now}
        </span>

        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`${content.ui.then} / ${content.ui.now}`}
          className="absolute inset-0 z-20 size-full cursor-ew-resize opacity-0"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          aria-pressed={pos <= 0.5}
          onClick={() => setPos(0)}
          className={cn(
            'pill flex-1 border px-3 py-1.5 text-sm font-semibold transition-colors',
            pos <= 0.5
              ? 'border-graphite bg-graphite text-stone'
              : 'border-stone-line text-graphite-soft hover:bg-stone-deep',
          )}
        >
          {content.ui.then}
        </button>
        <button
          type="button"
          aria-pressed={pos >= 99.5}
          onClick={() => setPos(100)}
          className={cn(
            'pill flex-1 border px-3 py-1.5 text-sm font-semibold transition-colors',
            pos >= 99.5
              ? 'border-graphite bg-graphite text-stone'
              : 'border-stone-line text-graphite-soft hover:bg-stone-deep',
          )}
        >
          {content.ui.now}
        </button>
      </div>
    </div>
  )
}
