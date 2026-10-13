import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SafeImage } from '@/components/SafeImage'
import { CompareSlider } from '@/components/CompareSlider'
import { cn } from 'cn'
import content from '@/data/content.json'

const MaterialDialogContext = createContext(null)

export function useMaterialDialog() {
  const ctx = useContext(MaterialDialogContext)
  if (!ctx) throw new Error('useMaterialDialog must be used within provider')
  return ctx
}

export function MaterialDialogProvider({ children }) {
  const [activeId, setActiveId] = useState(null)

  const open = useCallback((id) => setActiveId(id), [])
  const close = useCallback(() => setActiveId(null), [])

  const value = useMemo(() => ({ activeId, open, close }), [activeId, open, close])
  return (
    <MaterialDialogContext.Provider value={value}>
      {children}
      <MaterialDialog activeId={activeId} onOpen={open} onClose={close} />
    </MaterialDialogContext.Provider>
  )
}

function SimilarCard({ material, onOpen }) {
  const section = content.sections.find((s) => s.id === material.sectionId)
  const image = material.type === 'pair' ? material.thenImage : material.image
  const alt = material.type === 'pair' ? material.thenAlt : material.alt
  return (
    <button
      type="button"
      onClick={() => onOpen(material.id)}
      className="flex w-full items-center gap-3 rounded-[9px] border border-stone-line bg-stone p-2 text-left transition-colors hover:border-graphite-muted hover:bg-stone-deep"
    >
      <SafeImage
        src={image}
        alt={alt}
        className="size-14 shrink-0 rounded-[6px]"
        fallbackClassName="size-14 shrink-0 rounded-[6px]"
      />
      <span className="min-w-0">
        <span className="kicker block text-accent">{section?.title}</span>
        <span className="block truncate text-sm font-semibold text-graphite">
          {material.title}
        </span>
      </span>
    </button>
  )
}

function MetaRow({ label, value }) {
  return (
    <div>
      <dt className="kicker text-graphite-muted">{label}</dt>
      <dd className="text-sm text-graphite-soft">{value}</dd>
    </div>
  )
}

function MaterialDialog({ activeId, onOpen, onClose }) {
  const material = content.materials.find((m) => m.id === activeId)
  const index = content.materials.findIndex((m) => m.id === activeId)

  const step = (delta) => {
    if (index < 0) return
    const next = (index + delta + content.materials.length) % content.materials.length
    onOpen(content.materials[next].id)
  }

  const similar = material
    ? content.materials
        .filter((m) => m.id !== material.id && m.sectionId === material.sectionId)
        .slice(0, 3)
    : []

  return (
    <Dialog open={Boolean(material)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-[900px] gap-5 overflow-y-auto rounded-[14px] border border-stone-line bg-stone p-6">
        {material && (
          <>
            <DialogHeader className="gap-2 pr-10">
              <Badge className="pill w-fit bg-graphite px-2.5 text-[0.72rem] font-semibold tracking-[0.08em] text-stone uppercase">
                {content.types[material.type]}
              </Badge>
              <DialogTitle className="display-title text-2xl leading-tight sm:text-[1.7rem]">
                {material.title}
              </DialogTitle>
              <DialogDescription className="text-sm text-graphite-soft">
                {material.summary}
              </DialogDescription>
            </DialogHeader>

            {material.type === 'pair' ? (
              <CompareSlider
                thenImage={material.thenImage}
                thenAlt={material.thenAlt}
                nowImage={material.nowImage}
                nowAlt={material.nowAlt}
              />
            ) : (
              <SafeImage
                src={material.image}
                alt={material.alt}
                className="aspect-[16/10] w-full rounded-[14px] border border-stone-line"
                fallbackClassName="aspect-[16/10] w-full rounded-[14px]"
              />
            )}

            <p className="text-sm leading-relaxed text-graphite-soft">
              {material.description}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="pill border-accent/40 bg-accent/10 px-3 text-[0.72rem] font-semibold text-accent"
              >
                {content.ui.demoBadge}
              </Badge>
              {material.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="pill bg-stone-deep px-3 text-graphite-soft"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            <Separator className="bg-stone-line" />

            <dl className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
              <MetaRow label={content.ui.author} value={material.author} />
              <MetaRow label={content.ui.date} value={material.date} />
              <MetaRow label={content.ui.source} value={material.source} />
              <MetaRow
                label={content.ui.section}
                value={
                  content.sections.find((s) => s.id === material.sectionId)
                    ?.title
                }
              />
            </dl>

            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => step(-1)}
                className="pill gap-1.5 border-stone-line text-graphite-soft hover:border-graphite hover:bg-graphite hover:text-stone"
                aria-label={content.ui.prev}
              >
                <span aria-hidden="true">←</span>
                {content.ui.prev}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => step(1)}
                className="pill gap-1.5 border-stone-line text-graphite-soft hover:border-graphite hover:bg-graphite hover:text-stone"
                aria-label={content.ui.next}
              >
                {content.ui.next}
                <span aria-hidden="true">→</span>
              </Button>
            </div>

            {similar.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="kicker text-graphite-muted">
                  {content.ui.similar}
                </h3>
                <div
                  className={cn(
                    'grid gap-2',
                    similar.length > 1 && 'sm:grid-cols-2',
                  )}
                >
                  {similar.map((m) => (
                    <SimilarCard key={m.id} material={m} onOpen={onOpen} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
