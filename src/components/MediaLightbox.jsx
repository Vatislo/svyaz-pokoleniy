import { useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight, FileText, Music, Video } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

// Определяем, чем открыть файл в лайтбоксе: картинка, видео, аудио, PDF или ссылка.
function kindOf(src) {
  const path = String(src).split('?')[0].toLowerCase()
  if (/\.(mp4|webm|ogv|mov|m4v)$/.test(path)) return 'video'
  if (/\.(mp3|wav|ogg|m4a|aac|flac)$/.test(path)) return 'audio'
  if (/\.pdf$/.test(path)) return 'pdf'
  if (/\.(jpe?g|png|gif|webp|avif|svg|bmp|ico)$/.test(path)) return 'image'
  return 'file'
}

const kindLabels = {
  video: 'Видео',
  audio: 'Аудио',
  pdf: 'Документ',
  file: 'Файл',
}

/**
 * Модальное окно для приложенных файлов: показывает файл крупно
 * и позволяет переключаться между остальными стрелками или клавиатурой.
 * items: [{ src, label }]
 */
export function MediaLightbox({ items, index, onIndexChange, onClose }) {
  const count = items?.length || 0
  const open = count > 0 && index >= 0 && index < count
  const item = open ? items[index] : null
  const kind = item ? kindOf(item.src) : 'image'

  const go = useCallback(
    (delta) => {
      if (count < 2) return
      onIndexChange((index + delta + count) % count)
    },
    [count, index, onIndexChange],
  )

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1) }
      if (event.key === 'ArrowRight') { event.preventDefault(); go(1) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, go])

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/85 backdrop-blur-sm"
        className="flex h-[min(90vh,860px)] w-[min(96vw,1100px)] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-white/15 bg-[#16151a] p-0 text-stone shadow-2xl sm:max-w-[min(96vw,1100px)]"
      >
        {/* Шапка: заголовок, счётчик и закрытие */}
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <DialogTitle className="min-w-0 flex-1 truncate text-sm font-semibold text-stone">
            {item?.label || 'Файл'}
          </DialogTitle>
          <span className="shrink-0 text-xs tracking-wide text-stone/60">
            {index + 1} / {count}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть просмотр"
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/20 text-stone transition-colors hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {/* Файл крупно + стрелки переключения */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-[#0d0c10] p-3 sm:p-4">
          {item && kind === 'image' && (
            <img
              key={item.src}
              src={item.src}
              alt={item.label || 'Приложенный файл'}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          )}
          {item && kind === 'video' && (
            <video
              key={item.src}
              src={item.src}
              controls
              autoPlay
              className="max-h-full max-w-full rounded-lg bg-black"
            >
              Ваш браузер не поддерживает видео.
            </video>
          )}
          {item && kind === 'audio' && (
            <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-6">
              <Music className="size-10 text-stone/70" aria-hidden="true" />
              <audio key={item.src} src={item.src} controls autoPlay className="w-full" />
            </div>
          )}
          {item && kind === 'pdf' && (
            <iframe
              key={item.src}
              src={item.src}
              title={item.label || 'Документ'}
              className="h-full w-full rounded-lg border-0 bg-white"
            />
          )}
          {item && kind === 'file' && (
            <div className="flex max-w-sm flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-8 text-center">
              <FileText className="size-10 text-stone/70" aria-hidden="true" />
              <p className="text-sm text-stone/80">{item.label}</p>
              <a
                href={item.src}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/10"
              >
                Открыть файл в новой вкладке
              </a>
            </div>
          )}

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Предыдущий файл"
                className="absolute left-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/55 text-stone transition-colors hover:bg-black/80 sm:left-4"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Следующий файл"
                className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/55 text-stone transition-colors hover:bg-black/80 sm:right-4"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          )}
        </div>

        {/* Подсказка по управлению */}
        <div className="flex items-center justify-center gap-3 border-t border-white/10 px-4 py-2 text-xs text-stone/55">
          {kind !== 'file' && (
            <span className="inline-flex items-center gap-1.5">
              {kind === 'video' ? <Video className="size-3.5" aria-hidden="true" /> : <FileText className="size-3.5" aria-hidden="true" />}
              {kindLabels[kind]}
            </span>
          )}
          {count > 1 && <span>← → переключить файл, Esc закрыть</span>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
