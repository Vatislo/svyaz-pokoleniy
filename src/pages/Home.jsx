import { useEffect, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SafeImage } from '@/components/SafeImage'
import { CompareSlider } from '@/components/CompareSlider'
import { useMaterialDialog } from '@/components/MaterialDialog'
import { useSnapScenes } from '@/lib/useSnapScenes'
import { cn } from 'cn'
import content from '@/data/content.json'

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
        'flex flex-col justify-center',
        enabled
          ? 'absolute inset-0 overflow-y-auto overscroll-contain px-4 py-10 transition-[opacity,transform] duration-[420ms] ease-out md:px-8'
          : 'border-b border-stone-line px-4 py-14 md:px-8',
        enabled && hidden && 'pointer-events-none translate-y-[18px] opacity-0',
        className,
      )}
    >
      {children}
    </section>
  )
}

function CoverScene({ scene, active, enabled, onGo }) {
  const note = scene.note
  return (
    <SceneShell
      index={0}
      active={active}
      enabled={enabled}
      label={scene.navLabel}
      className="relative isolate !justify-center overflow-hidden bg-scene"
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
          onClick={() => onGo(scene.cta.target)}
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

function SectionsScene({ scene, active, enabled, onOpen }) {
  return (
    <SceneShell
      index={1}
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
          {content.sections.map((section) => (
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
                  onClick={() => onOpen?.(section.id)}
                  className="mt-1 w-fit text-sm font-semibold text-accent underline-offset-4 hover:text-accent-strong hover:underline"
                >
                  {content.ui.viewSection}
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </SceneShell>
  )
}

function CompareScene({ scene, active, enabled }) {
  const material = content.materials.find((m) => m.id === scene.materialId)
  if (!material) return null
  return (
    <SceneShell
      index={2}
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
          <p className="text-base font-semibold text-accent">{material.title}</p>
        </div>
        <div className="lg:col-span-7">
          <CompareSlider
            thenImage={material.thenImage}
            thenAlt={material.thenAlt}
            nowImage={material.nowImage}
            nowAlt={material.nowAlt}
            compact
          />
        </div>
      </div>
    </SceneShell>
  )
}

function StoryScene({ scene, active, enabled }) {
  const material = content.materials.find((m) => m.id === scene.materialId)
  const { open } = useMaterialDialog()
  if (!material) return null
  return (
    <SceneShell
      index={3}
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
            src={material.image}
            alt={material.alt}
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
              onClick={() => open(material.id)}
              className="pill mt-1 h-10 gap-2 bg-graphite px-5 text-sm font-semibold text-stone hover:bg-graphite-soft"
            >
              {scene.cta.label}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </SceneShell>
  )
}

function CtaScene({ scene, active, enabled }) {
  return (
    <SceneShell
      index={4}
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
  if (enabled) {
    return (
      <nav
        aria-label={content.ui.sceneIndicator}
        className="fixed top-1/2 right-4 z-40 hidden -translate-y-1/2 flex-col gap-1.5 rounded-full bg-stone/70 p-2 backdrop-blur-[6px] md:flex"
      >
        {scenes.map((scene, i) => {
          const isActive = i === active
          return (
            <button
              key={scene.id}
              type="button"
              aria-current={isActive ? 'step' : undefined}
              onClick={() => go(i)}
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
    )
  }

  return (
    <nav
      aria-label={content.ui.sceneIndicator}
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center gap-1.5 border-t border-stone-line bg-stone/85 px-3 py-2 backdrop-blur-md md:hidden"
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
  )
}

export function Home() {
  const scenes = content.home.scenes
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
            )}
          >
            {scene.kind === 'cover' && (
              <CoverScene
                scene={scene}
                active={active}
                enabled={enabled}
                onGo={goTo}
              />
            )}
            {scene.kind === 'sections' && (
              <SectionsScene scene={scene} active={active} enabled={enabled} />
            )}
            {scene.kind === 'compare' && (
              <CompareScene scene={scene} active={active} enabled={enabled} />
            )}
            {scene.kind === 'story' && (
              <StoryScene scene={scene} active={active} enabled={enabled} />
            )}
            {scene.kind === 'cta' && (
              <CtaScene scene={scene} active={active} enabled={enabled} />
            )}
          </div>
        ))}
      </div>
      <SceneIndicator scenes={scenes} active={active} enabled={enabled} go={goTo} />
      <div className="h-16 md:hidden" aria-hidden="true" />
    </div>
  )
}
