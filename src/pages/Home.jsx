import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SafeImage } from '@/components/SafeImage'
import { CompareSlider } from '@/components/CompareSlider'
import { useSnapScenes } from '@/lib/useSnapScenes'
import { api } from '@/lib/api'
import { cn } from 'cn'
import content from '@/data/content.json'

const PREVIEW_SECTIONS = 3

function SceneShell({ index, active, enabled, label, className, children }) {
  const ref = useRef(null)
  const hidden = enabled && index !== active

  useEffect(() => {
    if (ref.current) ref.current.inert = hidden
  }, [hidden])

  return (
    <section
      ref={ref}
      aria-label={label}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      className={cn(
        'flex flex-col',
        // className идёт ДО базовых классов: иначе tailwind-merge вырезает
        // `absolute` из-за `relative` в описании конкретной сцены и сцены
        // перестают накладываться друг на друга, «снап»-скролл ломается.
        className,
        enabled
          ? // В режиме сцен центрируем через авто-поля: `justify-center` в
            // прокручиваемом контейнере обрезает верх контента, и до него
            // нельзя было докрутить.
            'absolute inset-0 overflow-y-auto overscroll-contain px-4 py-10 transition-[opacity,transform] duration-[420ms] ease-out md:px-8 [&>*:not(.absolute)]:my-auto'
          : 'justify-center border-b border-stone-line px-4 py-14 md:px-8',
        enabled && hidden && 'pointer-events-none translate-y-[18px] opacity-0',
      )}
    >
      {children}
    </section>
  )
}

function CoverScene({ scene, index, active, enabled, onGo }) {
  const note = scene.note
  return (
    <SceneShell
      index={index}
      active={active}
      enabled={enabled}
      label={scene.navLabel}
      className="relative isolate overflow-hidden bg-scene"
    >
      <div className="absolute inset-0 -z-10">
        <SafeImage
          src={content.project.coverImage}
          alt={content.project.coverAlt}
          className="absolute inset-0 size-full opacity-60"
          fallbackClassName="absolute inset-0"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-scene/95 via-scene/70 to-scene/95"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-scene/85 via-transparent to-scene/85"
          aria-hidden="true"
        />
      </div>

      <div className="shell flex max-w-3xl flex-col items-start gap-5">
        <p className="kicker text-kicker-dark">{scene.kicker}</p>
        <h1 className="display-title text-[clamp(2.1rem,6vw,4rem)] text-scene-fg">
          {scene.title}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-scene-muted md:text-lg">
          {scene.subtitle}
        </p>
        <Button
          onClick={() => onGo(scene.cta.target, true)}
          className="pill mt-2 h-11 gap-2 bg-stone px-6 text-base font-semibold text-graphite hover:bg-white"
        >
          {scene.cta.label}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
        {note && (
          <p className="mt-4 border-l-4 border-accent bg-black/30 px-4 py-2 text-sm text-scene-muted backdrop-blur-sm">
            {note}
          </p>
        )}
      </div>
    </SceneShell>
  )
}

function SectionsScene({ scene, index, active, enabled }) {
  // На главной показываем лишь несколько примеров разделов,
  // полный список доступен в каталоге.
  const previewSections = content.sections.slice(0, PREVIEW_SECTIONS)
  return (
    <SceneShell
      index={index}
      active={active}
      enabled={enabled}
      label={scene.navLabel}
      className="relative isolate"
    >
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_srgb,var(--ash)_10%,transparent),transparent)]"
        aria-hidden="true"
      />
      <div className="shell flex flex-col gap-8">
        <div className="flex max-w-2xl flex-col gap-3">
          <p className="kicker text-kicker">{scene.kicker}</p>
          <h2 className="display-title text-[clamp(1.7rem,4vw,2.8rem)] text-graphite">
            {scene.title}
          </h2>
          <p className="text-base leading-relaxed text-graphite-soft">
            {scene.subtitle}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {previewSections.map((section) => (
            <article
              key={section.id}
              className="group flex flex-col overflow-hidden rounded-[14px] border border-stone-line bg-stone transition-all duration-200 hover:-translate-y-[3px] hover:shadow-card"
            >
              <div className="relative aspect-video overflow-hidden bg-stone-deep">
                <SafeImage
                  src={section.image}
                  alt={section.alt}
                  className="absolute inset-0 size-full"
                  fallbackClassName="absolute inset-0"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <h3 className="display-title text-lg text-graphite">
                  {section.title}
                </h3>
                <p className="flex-1 text-sm leading-relaxed text-graphite-soft">
                  {section.summary}
                </p>
                <a
                  href={`#/catalog?section=${section.id}`}
                  className="mt-1 w-fit text-sm font-semibold text-accent underline-offset-4 hover:text-accent-strong hover:underline"
                >
                  {content.ui.viewSection}
                </a>
              </div>
            </article>
          ))}
        </div>

        {scene.allSectionsLink && (
          <a
            href={scene.allSectionsLink.href}
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-accent underline-offset-4 hover:underline"
          >
            {scene.allSectionsLink.label}
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        )}
      </div>
    </SceneShell>
  )
}

// Сцена «Тогда и сейчас»: показывает первый проект участников
// с фотографиями тогда и сейчас.
function CompareScene({ scene, index, active, enabled, project }) {
  if (!project) return null
  return (
    <SceneShell
      index={index}
      active={active}
      enabled={enabled}
      label={scene.navLabel}
    >
      <div className="shell grid items-center gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-5">
          <p className="kicker text-kicker">{scene.kicker}</p>
          <h2 className="display-title text-[clamp(1.6rem,3.5vw,2.5rem)] text-graphite">
            {scene.title}
          </h2>
          <p className="text-base leading-relaxed text-graphite-soft">
            {scene.text}
          </p>
        </div>
        <div className="lg:col-span-7">
          <CompareSlider
            thenImage={project.before_image_url || project.after_image_url}
            thenAlt={`Фотография «тогда»: ${project.title}`}
            nowImage={project.after_image_url || project.before_image_url}
            nowAlt={`Фотография «сейчас»: ${project.title}`}
            compact
          />
        </div>
      </div>
    </SceneShell>
  )
}

// Сцена «История проекта»: показывает первый опубликованный проект.
function StoryScene({ scene, index, active, enabled, project }) {
  if (!project) return null
  return (
    <SceneShell
      index={index}
      active={active}
      enabled={enabled}
      label={scene.navLabel}
      className="relative isolate"
    >
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(55%_55%_at_30%_50%,color-mix(in_srgb,var(--accent)_10%,transparent),transparent)]"
        aria-hidden="true"
      />
      <div className="shell grid items-center gap-8 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <SafeImage
            src={project.image_url}
            alt={project.title}
            className="aspect-[4/3] w-full rounded-[14px] border border-stone-line shadow-card"
            fallbackClassName="aspect-[4/3] w-full rounded-[14px]"
          />
        </div>
        <div className="flex flex-col gap-4 lg:col-span-6">
          <p className="kicker text-kicker">{scene.kicker}</p>
          <h2 className="display-title text-[clamp(1.6rem,3.5vw,2.5rem)] text-graphite">
            {scene.title}
          </h2>
          <p className="text-base leading-relaxed text-graphite-soft">
            {scene.text}
          </p>
          <div>
            <Button
              asChild
              className="pill mt-1 h-10 gap-2 bg-graphite px-5 text-sm font-semibold text-stone hover:bg-graphite-soft"
            >
              <a href={`#/project/${project.id}`}>
                {scene.cta.label}
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </Button>
            <a href="#/catalog" className="mt-3 inline-flex w-fit items-center gap-2 text-sm font-semibold text-accent underline-offset-4 hover:underline">
              Перейти к материалам <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </SceneShell>
  )
}

function CtaScene({ scene, index, active, enabled }) {
  return (
    <SceneShell
      index={index}
      active={active}
      enabled={enabled}
      label={scene.navLabel}
      className="relative isolate overflow-hidden bg-scene"
    >
      <div
        className="absolute inset-x-0 top-0 -z-10 h-2/3 bg-[radial-gradient(50%_100%_at_50%_0%,color-mix(in_srgb,var(--accent)_30%,transparent),transparent)]"
        aria-hidden="true"
      />
      <div className="shell flex max-w-2xl flex-col items-center gap-5 text-center">
        <p className="kicker text-kicker-dark">{scene.kicker}</p>
        <h2 className="display-title text-[clamp(1.8rem,4.5vw,3rem)] text-scene-fg">
          {scene.title}
        </h2>
        <p className="text-base leading-relaxed text-scene-muted md:text-lg">
          {scene.text}
        </p>
        <Button
          asChild
          className="pill mt-2 h-11 bg-stone px-6 text-base font-semibold text-graphite hover:bg-white"
        >
          <a href={scene.cta.href}>{scene.cta.label}</a>
        </Button>
      </div>
    </SceneShell>
  )
}

function SceneIndicator({ scenes, active, enabled, go }) {
  return (
    <>
      {/* Точки сбоку: на планшетах и компьютерах */}
      <nav
        aria-label={content.ui.sceneIndicator}
        className="fixed top-1/2 right-4 z-40 hidden -translate-y-1/2 flex-col gap-1.5 rounded-2xl border border-stone-line bg-stone p-2 shadow-card md:flex"
      >
        {scenes.map((scene, i) => {
          const isActive = i === active
          return (
            <button
              key={scene.id}
              type="button"
              aria-current={isActive ? 'step' : undefined}
              onClick={() => go(i, !enabled)}
              className={cn(
                'pill flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors',
                isActive
                  ? 'bg-graphite text-stone'
                  : 'text-graphite-soft hover:bg-stone-deep',
              )}
            >
              <span
                className={cn(isActive && 'text-ash')}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                className={cn(
                  'hidden whitespace-nowrap lg:inline',
                  isActive ? 'lg:inline' : 'lg:hidden xl:inline',
                )}
              >
                {scene.navLabel}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Панель снизу: на телефоне */}
      <nav
        aria-label={content.ui.sceneIndicator}
        className="fixed inset-x-0 bottom-0 z-40 flex justify-center gap-1.5 border-t border-stone-line bg-stone/95 px-3 py-2 shadow-card md:hidden"
      >
        {scenes.map((scene, i) => {
          const isActive = i === active
          return (
            <button
              key={scene.id}
              type="button"
              aria-current={isActive ? 'step' : undefined}
              onClick={() => go(i, true)}
              className={cn(
                'pill flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors',
                isActive
                  ? 'bg-graphite text-stone'
                  : 'text-graphite-soft hover:bg-stone-deep',
              )}
            >
              <span>{String(i + 1).padStart(2, '0')}</span>
              {isActive && <span className="whitespace-nowrap">{scene.navLabel}</span>}
            </button>
          )
        })}
      </nav>
    </>
  )
}

export function Home() {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    let cancelled = false
    api('/api/projects')
      .then((result) => { if (!cancelled) setProjects(Array.isArray(result) ? result : []) })
      .catch(() => { if (!cancelled) setProjects([]) })
    return () => { cancelled = true }
  }, [])

  // Проект с фотографиями тогда и сейчас для сцены сравнения.
  const compareProject = useMemo(
    () => projects.find((p) => p.before_image_url && p.after_image_url) || null,
    [projects],
  )
  // Первый проект с обложкой для сцены истории.
  const storyProject = useMemo(
    () => projects.find((p) => p.image_url) || projects[0] || null,
    [projects],
  )

  // Сцены с материалами показываются только если есть что показать.
  const scenes = useMemo(
    () => content.home.scenes.filter((scene) => {
      if (scene.kind === 'compare') return Boolean(compareProject)
      if (scene.kind === 'story') return Boolean(storyProject)
      return true
    }),
    [compareProject, storyProject],
  )

  const { active, go, enabled } = useSnapScenes(scenes.length)
  const sceneRefs = useRef([])

  const goTo = (index, scrollIntoView = false) => {
    go(index)
    if (scrollIntoView || !enabled) {
      sceneRefs.current[index]?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="relative">
      <div
        className={cn(
          enabled
            ? 'relative h-[calc(100dvh-4rem)] overflow-hidden'
            : 'flex flex-col',
        )}
      >
        {scenes.map((scene, i) => (
          <div
            key={scene.id}
            ref={(el) => {
              sceneRefs.current[i] = el
            }}
            className={cn(
              enabled ? 'absolute inset-0' : 'min-h-[70vh]',
              // Обёртки сцен накладываются друг на друга: без этого правила
              // невидимая обёртка соседней сцены перехватывает все клики,
              // и кнопки активной сцены не работают.
              enabled && i !== active && 'pointer-events-none',
            )}
          >
            {scene.kind === 'cover' && (
              <CoverScene
                scene={scene}
                index={i}
                active={active}
                enabled={enabled}
                onGo={goTo}
              />
            )}
            {scene.kind === 'sections' && (
              <SectionsScene scene={scene} index={i} active={active} enabled={enabled} />
            )}
            {scene.kind === 'compare' && (
              <CompareScene scene={scene} index={i} active={active} enabled={enabled} project={compareProject} />
            )}
            {scene.kind === 'story' && (
              <StoryScene scene={scene} index={i} active={active} enabled={enabled} project={storyProject} />
            )}
            {scene.kind === 'cta' && (
              <CtaScene scene={scene} index={i} active={active} enabled={enabled} />
            )}
          </div>
        ))}
      </div>
      <SceneIndicator scenes={scenes} active={active} enabled={enabled} go={goTo} />
      <div className="h-16 md:hidden" aria-hidden="true" />
    </div>
  )
}
