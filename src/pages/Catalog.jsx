import { useEffect, useMemo, useState } from 'react'
import { Shuffle, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Card } from '@/components/ui/card'
import { cn } from 'cn'
import content from '@/data/content.json'
import { api } from '@/lib/api'
import { PublicProjectCard } from '@/components/PublicProjectCard'
import { SiteFooter } from '@/components/SiteFooter'

function chipClass(active) {
  return cn(
    'pill flex items-center gap-1.5 border px-3.5 py-1.5 text-sm font-semibold transition-colors',
    active
      ? 'border-graphite bg-graphite text-stone'
      : 'border-graphite-muted text-graphite-soft hover:bg-stone-deep',
  )
}

// Реальные имена участников проекта вписываются в src/data/content.json,
// в блок credits (authors / leaders). Пустые имена не выводятся.
function ProjectCredits() {
  const groups = [content.credits?.authors, content.credits?.leaders].filter(
    (group) => Array.isArray(group?.items) && group.items.some((item) => item.name?.trim()),
  )

  if (groups.length === 0) return null

  return (
    <section
      aria-label={content.credits.title}
      className="rounded-[14px] border border-stone-line bg-stone-deep p-6"
    >
      <h2 className="display-title text-xl text-graphite">{content.credits.title}</h2>
      <div className="mt-4 grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="kicker text-graphite-muted">{group.title}</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {group.items
                .filter((item) => item.name?.trim())
                .map((item) => (
                  <li key={item.role} className="flex flex-wrap items-baseline gap-2">
                    <span className="text-xs tracking-[0.08em] text-graphite-muted uppercase">
                      {item.role}
                    </span>
                    <span className="text-sm font-semibold text-graphite">{item.name}</span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

export function Catalog({ search }) {
  const [query, setQuery] = useState('')
  const [sections, setSections] = useState([])
  const [types, setTypes] = useState([])
  const [submittedProjects, setSubmittedProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [activeTags, setActiveTags] = useState(() => (search.get('tag') ? [search.get('tag')] : []))

  const sectionFromUrl = search.get('section')
  const tagFromUrl = search.get('tag')

  useEffect(() => {
    let cancelled = false
    api('/api/projects')
      .then((result) => { if (!cancelled) setSubmittedProjects(Array.isArray(result) ? result : []) })
      .catch(() => { if (!cancelled) setSubmittedProjects([]) })
      .finally(() => { if (!cancelled) setProjectsLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    setActiveTags(tagFromUrl ? [tagFromUrl] : [])
  }, [tagFromUrl])

  useEffect(() => {
    if (sectionFromUrl && content.sections.some((s) => s.id === sectionFromUrl)) {
      setSections([sectionFromUrl])
    }
  }, [sectionFromUrl])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return submittedProjects.filter((project) => {
      if (sections.length > 0 && !sections.includes(project.topic)) return false
      if (types.length > 0 && !types.includes(project.project_type)) return false
      const projectTags = (project.tags || []).map((tag) => tag.toLowerCase())
      if (activeTags.length > 0 && !activeTags.some((tag) => projectTags.includes(tag.toLowerCase()))) return false
      if (!q) return true
      return [project.title, project.description, project.author, project.author_role, ...(project.tags || [])].join(' ').toLowerCase().includes(q)
    })
  }, [query, sections, types, activeTags, submittedProjects])

  const availableTags = useMemo(
    () => [...new Set(submittedProjects.flatMap((item) => item.tags || []))].sort((a, b) => a.localeCompare(b, 'ru')),
    [submittedProjects],
  )

  const toggleTag = (tag) => {
    setActiveTags((current) => (
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    ))
  }

  const reset = () => {
    setQuery('')
    setSections([])
    setTypes([])
    setActiveTags([])
  }

  const random = () => {
    const pool = filtered.length > 0 ? filtered : submittedProjects
    const pick = pool[Math.floor(Math.random() * pool.length)]
    if (pick) window.location.hash = `#/project/${pick.id}`
  }

  return (
    <>
      <div className="shell flex flex-col gap-8 py-12">
        <header className="flex max-w-[62ch] flex-col gap-3">
          <p className="kicker text-kicker">{content.catalog.kicker}</p>
          <h1 className="display-title text-[clamp(1.8rem,5vw,3rem)] text-graphite">
            {content.catalog.title}
          </h1>
          <p className="text-base leading-relaxed text-graphite-soft">
            {content.catalog.lead}
          </p>
          <div className="mt-2"><Button asChild className="pill gap-2"><a href="#/create-project">Предложить свой проект <span aria-hidden="true">→</span></a></Button></div>
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

          {availableTags.length > 0 && <div className="flex flex-col gap-3">
            <span className="kicker text-graphite-muted">Фильтр по тегам</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTags([...availableTags])}
                className={chipClass(activeTags.length === availableTags.length && availableTags.length > 0)}
              >
                Выбрать все теги
              </button>
              <button
                type="button"
                onClick={() => setActiveTags([])}
                className={chipClass(false)}
              >
                Убрать выбранные
              </button>
              {availableTags.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  aria-pressed={activeTags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                  className={chipClass(activeTags.includes(tag))}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>}
        </Card>

        {projectsLoading && <p className="text-sm text-graphite-muted">Загружаем опубликованные проекты участников…</p>}
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
            disabled={submittedProjects.length === 0}
            className="pill gap-2 border-accent px-4 text-accent hover:border-accent-strong hover:bg-accent-strong hover:text-stone"
          >
            <Shuffle className="size-4" aria-hidden="true" />
            {content.ui.random}
          </Button>
        </div>

        {filtered.length > 0 ? (
          <div className="grid gap-[1.4rem] [grid-template-columns:repeat(auto-fill,minmax(270px,1fr))]">
            {filtered.map((project) => <PublicProjectCard key={`project-${project.id}`} project={project} />)}
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

        <ProjectCredits />
      </div>

      <SiteFooter />
    </>
  )
}
