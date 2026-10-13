import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from 'cn'
import content from '@/data/content.json'

export function SafeImage({ src, alt, className, fallbackClassName }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'flex flex-col items-center justify-center gap-2 bg-stone-deep text-graphite-muted',
          className,
          fallbackClassName,
        )}
      >
        <ImageOff className="size-6" aria-hidden="true" />
        <span className="px-4 text-center text-xs">
          {content.ui.imageFallback}
        </span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  )
}
