import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SafeImage } from '@/components/SafeImage'
import content from '@/data/content.json'

export function MaterialCard({ material, onOpen }) {
  const section = content.sections.find((s) => s.id === material.sectionId)
  const isPair = material.type === 'pair'
  const image = isPair ? material.thenImage : material.image
  const alt = isPair ? material.thenAlt : material.alt

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[14px] border border-stone-line bg-stone transition-all duration-200 hover:-translate-y-[3px] hover:border-graphite-muted hover:shadow-card">
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-deep">
        <SafeImage
          src={image}
          alt={alt}
          className="absolute inset-0 size-full transition-transform duration-300 group-hover:scale-[1.03]"
          fallbackClassName="absolute inset-0"
        />
        <Badge className="pill absolute top-3 left-3 bg-graphite/85 px-2.5 text-[0.72rem] font-semibold tracking-[0.08em] text-stone uppercase backdrop-blur-sm">
          {content.types[material.type]}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="flex flex-wrap items-center gap-1.5 text-[0.7rem] font-semibold tracking-[0.12em] uppercase">
          <span className="text-accent">{section?.title}</span>
          <span className="text-graphite-muted" aria-hidden="true">
            ·
          </span>
          <span className="text-graphite-muted">
            {content.types[material.type]}
          </span>
        </p>

        <h3 className="display-title text-lg text-graphite">{material.title}</h3>
        <p className="flex-1 text-sm leading-relaxed text-graphite-soft">
          {material.summary}
        </p>

        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpen(material.id)}
            className="pill border-stone-line text-graphite-soft transition-colors group-hover/btn:border-graphite-muted hover:border-graphite hover:bg-graphite hover:text-stone"
          >
            {content.ui.details}
          </Button>
        </div>
      </div>
    </article>
  )
}
