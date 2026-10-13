import { useEffect, useMemo, useState } from 'react'
import { Shuffle, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Card } from '@/components/ui/card'
import { MaterialCard } from '@/components/MaterialCard'
import { useMaterialDialog } from '@/components/MaterialDialog'
import { cn } from 'cn'
import content from '@/data/content.json'

function chipClass(active) {
  return cn(
    'pill flex items-center gap-1.5 border px-3.5 py-1.5 text-sm font-semibold transition-colors',
    active
      ? 'border-graphite bg-graphite text-stone'
      : 'border-graphite-muted text-graphite-soft hover:bg-stone-deep',
  )
}

export function Catalog({ search }) {
  const { open } = useMaterialDialog()
  const [query, setQuery] = useState('')
  const [sections, setSections] = useState([])
  const [types, setTypes] = useState([])

  const sectionFromUrl = search.get('section')

  useEffect(() => {
    if (sectionFromUrl && content.sections.some((s) => s.id === sectionFromUrl)) {
      setSections([sectionFromUrl])
    }
  }, [sectionFromUrl])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return content.materials.filter((m) => {
      if (sections.length > 0 && !sections.includes(m.sectionId)) return false
      if (types.length > 0 && !types.includes(m.type)) return false
      if (!q) return true
      const haystack = [
        m.title,
        m.summary,
        m.description,
        m.author,
        m.source,
        ...(m.tags || []),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [query, sections, types])

  const reset = () => {
    setQuery('')
    setSections([])
    setTypes([])
  }

  const random = () => {
    const pool = filtered.length > 0 ? filtered : content.materials
    const pick = pool[Math.floor(Math.random() * pool.length)]
    if (pick) open(pick.id)
  }

  return (
    <div className="shell flex flex-col gap-8 py-12">
      <header className="flex max-w-[62ch] flex-col gap-3">
        <p className="kicker text-kicker">{content.catalog.kicker}</p>
        <h1 className="display-title text-[clamp(1.8rem,5vw,3rem)] text-graphite">
          {content.catalog.title}
        </h1>
        <p className="text-base leading-relaxed text-graphite-soft">
          {content.catalog.lead}
        </p>
      </header>

      <Card className="gap-5 rounded-[14px] border border-stone-line bg-stone-deep p-5">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="catalog-search"
            className="kicker text-graphite-muted"
          >
            {content.ui.searchLabel}
          </label>
          <div className="relative max-w-[520px]">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-graphite-muted"
              aria-hidden="true"
            />
            <Input
              id="catalog-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={content.ui.searchPlaceholder}
              className="pill h-11 border-stone-line bg-stone pl-9 text-base text-graphite placeholder:text-graphite-muted"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="kicker text-graphite-muted">
            {content.ui.filterSections}
          </span>
          <ToggleGroup
            type="multiple"
            value={sections}
            onValueChange={setSections}
            className="flex w-full flex-wrap gap-2"
          >
            {content.sections.map((s) => {
              const active = sections.includes(s.id)
              return (
                <ToggleGroupItem
                  key={s.id}
                  value={s.id}
                  aria-label={s.title}
                  className={cn(chipClass(active), 'data-[state=on]:border-graphite data-[state=on]:bg-graphite data-[state=on]:text-stone')}
                >
                  <span aria-hidden="true">{active ? '●' : '○'}</span>
                  {s.title}
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>
        </div>

        <div className="flex flex-col gap-3">
          <span className="kicker text-graphite-muted">
            {content.ui.filterTypes}
          </span>
          <ToggleGroup
            type="multiple"
            value={types}
            onValueChange={setTypes}
            className="flex w-full flex-wrap gap-2"
          >
            {Object.entries(content.types).map(([id, label]) => {
              const active = types.includes(id)
              return (
                <ToggleGroupItem
                  key={id}
                  value={id}
                  aria-label={label}
                  className={cn(chipClass(active), 'data-[state=on]:border-graphite data-[state=on]:bg-graphite data-[state=on]:text-stone')}
                >
                  <span aria-hidden="true">{active ? '●' : '○'}</span>
                  {label}
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-graphite-soft"
        >
          {content.ui.foundCount}: {filtered.length}
        </p>
        <Button
          variant="outline"
          onClick={random}
          className="pill gap-2 border-accent px-4 text-accent hover:border-accent-strong hover:bg-accent-strong hover:text-stone"
        >
          <Shuffle className="size-4" aria-hidden="true" />
          {content.ui.random}
        </Button>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-[1.4rem] [grid-template-columns:repeat(auto-fill,minmax(270px,1fr))]">
          {filtered.map((m) => (
            <MaterialCard key={m.id} material={m} onOpen={open} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[14px] border-2 border-dashed border-stone-line bg-stone-deep px-6 py-16 text-center">
          <h2 className="display-title text-xl text-graphite">
            {content.ui.emptyTitle}
          </h2>
          <p className="max-w-md text-sm text-graphite-soft">
            {content.ui.emptyText}
          </p>
          <Button
            variant="outline"
            onClick={reset}
            className="pill mt-2 border-stone-line text-graphite hover:border-graphite hover:bg-graphite hover:text-stone"
          >
            {content.ui.reset}
          </Button>
        </div>
      )}
    </div>
  )
}
