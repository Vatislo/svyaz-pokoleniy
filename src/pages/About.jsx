import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import content from '@/data/content.json'

export function About() {
  return (
    <div className="shell flex max-w-[960px] flex-col gap-8 py-12">
      <header className="flex flex-col gap-3">
        <p className="kicker text-kicker">{content.about.kicker}</p>
        <h1 className="display-title text-[clamp(1.8rem,5vw,3rem)] text-graphite">
          {content.about.title}
        </h1>
        <p className="max-w-[62ch] text-base leading-relaxed text-graphite-soft">
          {content.about.lead}
        </p>
      </header>

      <p className="border-l-4 border-accent bg-stone-deep px-5 py-4 text-sm leading-relaxed text-graphite-soft">
        {content.about.warning}
      </p>

      <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
        {content.about.cards.map((card) => (
          <Card
            key={card.title}
            className="gap-2 rounded-[14px] border border-stone-line bg-stone p-5"
          >
            <h2 className="display-title text-lg text-graphite">{card.title}</h2>
            <p className="text-sm leading-relaxed text-graphite-soft">
              {card.text}
            </p>
          </Card>
        ))}
      </div>

      <Card className="gap-4 rounded-[14px] border border-stone-line bg-stone-deep p-6">
        <h2 className="display-title text-xl text-graphite">
          {content.about.structure.title}
        </h2>
        <dl className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
          {content.about.structure.items.map((item) => (
            <div key={item.label}>
              <dt className="kicker text-graphite-muted">{item.label}</dt>
              <dd className="text-sm leading-relaxed text-graphite-soft">
                {item.text}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <div>
        <Button
          asChild
          variant="outline"
          className="pill gap-2 border-stone-line text-graphite hover:border-graphite hover:bg-graphite hover:text-stone"
        >
          <a href="#/catalog">
            <ArrowLeft className="size-4" aria-hidden="true" />
            {content.about.backLabel}
          </a>
        </Button>
      </div>
    </div>
  )
}
