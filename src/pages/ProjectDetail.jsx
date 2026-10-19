import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, ExternalLink, Play, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SafeImage } from '@/components/SafeImage'
import { PublicProjectCard } from '@/components/PublicProjectCard'
import { CompareSlider } from '@/components/CompareSlider'
import { MediaLightbox } from '@/components/MediaLightbox'
import { SiteFooter } from '@/components/SiteFooter'
import { api } from '@/lib/api'

const typeNames = { photo: 'Фотография', story: 'Текстовая история', video: 'Видео', gif: 'GIF-анимация', pair: 'Тогда / сейчас', other: 'Другое' }

// Единый формат страницы проекта: шапка (раздел, тип, заголовок,
// полное описание), затем медиа, затем блок с автором, датой,
// источником и тегами. Описание выводится один раз.
// Каждый приложенный файл показан в отдельной рамке, а клик по
// медиа открывает модальное окно с переключением между файлами.
export function ProjectDetail({ id }) {
  const [project, setProject] = useState(null)
  const [projects, setProjects] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewerIndex, setViewerIndex] = useState(-1)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([api(`/api/projects/${encodeURIComponent(id)}`), api('/api/projects')])
      .then(([selected, all]) => {
        if (cancelled) return
        setProject(selected)
        setProjects(Array.isArray(all) ? all : [])
        setError('')
      })
      .catch((err) => { if (!cancelled) setError(err.message || 'Не удалось загрузить проект') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  const index = projects.findIndex((item) => String(item.id) === String(id))
  const similar = useMemo(() => project ? projects.filter((item) => String(item.id) !== String(project.id) && (item.topic === project.topic || (item.tags || []).some((tag) => (project.tags || []).includes(tag)))).slice(0, 3) : [], [project, projects])
  const previous = index > 0 ? projects[index - 1] : null
  const next = index >= 0 && index < projects.length - 1 ? projects[index + 1] : null

  if (loading) return <>
    <div className="shell py-20 text-center text-graphite-soft">Загружаем проект…</div>
    <SiteFooter />
  </>
  if (error || !project) return <>
    <div className="shell py-20"><div className="mx-auto max-w-xl rounded-2xl border border-stone-line bg-stone p-8 text-center"><p className="kicker text-kicker">проект не найден</p><h1 className="display-title mt-3 text-2xl text-graphite">Не удалось открыть материал</h1><p className="mt-3 text-sm text-graphite-soft">{error || 'Возможно, проект ещё не опубликован или был удалён.'}</p><Button asChild className="pill mt-6"><a href="#/catalog">Вернуться в каталог</a></Button></div></div>
    <SiteFooter />
  </>

  const tags = Array.isArray(project.tags) ? project.tags : []
  const gallery = Array.isArray(project.gallery) ? project.gallery : []
  const isVideo = project.project_type === 'video' && project.media_url
  const before = project.before_image_url || null
  const after = project.after_image_url || null
  const isPair = project.project_type === 'pair' && before && after
  // Если по какой-то причине у пары сохранилось только одно фото,
  // показываем его отдельным кадром, без ползунка.
  const lonePairImage = project.project_type === 'pair' && !isPair ? (before || after) : null

  // Все медиафайлы поста одним списком: обложка, фото сравнения,
  // видео, GIF, файл и галерея. По этому списку работает
  // переключение «вперёд/назад» в модальном окне.
  const mediaItems = []
  if (project.image_url) mediaItems.push({ src: project.image_url, label: 'Обложка' })
  if (before) mediaItems.push({ src: before, label: 'Фотография «тогда»' })
  if (after) mediaItems.push({ src: after, label: 'Фотография «сейчас»' })
  if (isVideo) mediaItems.push({ src: project.media_url, label: 'Видео' })
  if (project.project_type === 'gif' && project.media_url) mediaItems.push({ src: project.media_url, label: 'GIF-анимация' })
  if (project.project_type === 'other' && project.media_url) mediaItems.push({ src: project.media_url, label: 'Приложенный файл' })
  gallery.forEach((src, galleryIndex) => mediaItems.push({ src, label: `Фотография ${galleryIndex + 1}` }))

  const openMedia = (src) => {
    const itemIndex = mediaItems.findIndex((item) => item.src === src)
    if (itemIndex >= 0) setViewerIndex(itemIndex)
  }

  const frameClass = 'border-t border-stone-line'

  return <>
    <div className="shell max-w-5xl py-8 md:py-12">
    <a href="#/catalog" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-graphite-soft hover:text-accent"><ArrowLeft className="size-4" /> Назад в каталог</a>
    <article className="overflow-hidden rounded-2xl border border-stone-line bg-stone">
      {/* Шапка: на обложке заголовок лежит поверх снимка на градиенте,
          без обложки шапка остаётся обычной */}
      {project.image_url ? (
        <header className="relative">
          <button
            type="button"
            onClick={() => openMedia(project.image_url)}
            className="group block w-full"
            aria-label="Открыть обложку в отдельном окне"
          >
            <SafeImage src={project.image_url} alt={project.title} className="aspect-[16/9] w-full object-cover sm:aspect-[16/7]" fallbackClassName="aspect-[16/9] w-full sm:aspect-[16/7]" />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent" aria-hidden="true" />
            <span className="pointer-events-none absolute right-4 bottom-4 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
              Открыть
            </span>
          </button>
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="pill border-white/40 bg-black/25 px-3 text-[0.72rem] font-semibold text-white backdrop-blur-sm">
                {typeNames[project.project_type] || 'Проект'}
              </Badge>
              {project.topic_title && <Badge variant="secondary" className="pill bg-white/15 px-3 text-[0.72rem] font-semibold text-white backdrop-blur-sm">{project.topic_title}</Badge>}
              {gallery.length > 0 && <span className="text-xs font-medium text-white/80">Фотографий: {gallery.length}</span>}
            </div>
            <h1 className="display-title mt-3 max-w-3xl text-[clamp(1.5rem,3.6vw,2.6rem)] leading-tight text-white drop-shadow-sm">{project.title}</h1>
          </div>
        </header>
      ) : (
        <header className="p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="pill border-graphite-muted px-3 text-[0.72rem] font-semibold text-graphite-soft">
              {typeNames[project.project_type] || 'Проект'}
            </Badge>
            {project.topic_title && <Badge variant="secondary" className="pill bg-stone-deep px-3 text-[0.72rem] font-semibold text-graphite-soft">{project.topic_title}</Badge>}
            {gallery.length > 0 && <span className="text-xs text-graphite-muted">Фотографий в проекте: {gallery.length}</span>}
          </div>
          <h1 className="display-title mt-3 max-w-4xl text-[clamp(1.6rem,4vw,3rem)] leading-tight text-graphite">{project.title}</h1>
        </header>
      )}

      {/* Описание и теги отдельным лёгким блоком под шапкой */}
      <div className="px-5 pt-5 pb-5 sm:px-7">
        <p className="max-w-3xl whitespace-pre-line text-base leading-relaxed text-graphite-soft">{project.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">{tags.map((tag) => <a key={tag} href={`#/catalog?tag=${encodeURIComponent(tag)}`} className="inline-flex items-center gap-1 rounded-full border border-stone-line px-3 py-1.5 text-sm text-graphite-soft hover:border-accent hover:text-accent"><Tag className="size-3.5" />#{tag}</a>)}</div>
      </div>

      {/* Главный материал: во всю ширину статьи, без рамок и подписей */}
      {isPair && (
        <div className="px-5 pt-6 pb-6 sm:px-7">
          <CompareSlider
            compact
            thenImage={before}
            thenAlt={`Фотография «тогда»: ${project.title}`}
            nowImage={after}
            nowAlt={`Фотография «сейчас»: ${project.title}`}
          />
        </div>
      )}
      {lonePairImage && (
        <div className="px-5 pt-6 pb-6 sm:px-7">
          <button
            type="button"
            onClick={() => openMedia(lonePairImage)}
            className="group relative block w-full overflow-hidden rounded-[14px] bg-stone-deep"
            aria-label="Открыть фотографию в отдельном окне"
          >
            <SafeImage src={lonePairImage} alt="Фотография из сравнения" className="max-h-[460px] w-full object-contain" fallbackClassName="aspect-video w-full" />
            <span className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">Открыть</span>
          </button>
        </div>
      )}
      {isVideo && (
        <div className="px-5 pt-6 pb-6 sm:px-7">
          <div className="relative overflow-hidden rounded-[14px] bg-black">
            <video src={project.media_url} preload="metadata" muted playsInline className="max-h-[460px] w-full object-contain">
              Ваш браузер не поддерживает видео.
            </video>
            <button
              type="button"
              onClick={() => openMedia(project.media_url)}
              className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors hover:bg-black/45"
              aria-label="Открыть видео в отдельном окне"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-white/90 text-graphite shadow-lg">
                <Play className="ml-0.5 size-6" aria-hidden="true" />
              </span>
            </button>
          </div>
        </div>
      )}
      {project.project_type === 'gif' && project.media_url && (
        <div className="px-5 pt-6 pb-6 sm:px-7">
          <button
            type="button"
            onClick={() => openMedia(project.media_url)}
            className="group relative block w-full overflow-hidden rounded-[14px] bg-stone-deep"
            aria-label="Открыть GIF в отдельном окне"
          >
            <SafeImage src={project.media_url} alt={project.title} className="max-h-[460px] w-full object-contain" fallbackClassName="aspect-video w-full" />
            <span className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">Открыть</span>
          </button>
        </div>
      )}
      {project.project_type === 'other' && project.media_url && (
        <div className="px-5 pt-6 pb-6 sm:px-7">
          <button
            type="button"
            onClick={() => openMedia(project.media_url)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
          >
            Открыть прикреплённый файл <ExternalLink className="size-4" />
          </button>
        </div>
      )}

      {/* Приложенные фотографии: каждая в отдельной рамке с отступом */}
      {gallery.length > 0 && (
        <section aria-label="Дополнительные фотографии проекта" className={`${frameClass} bg-stone-deep p-4 sm:p-6`}>
          <h2 className="kicker mb-4 text-graphite-muted">Ещё фотографии · {gallery.length}</h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((src, galleryIndex) => (
              <li key={src} className="rounded-2xl border border-stone-line bg-stone p-2 shadow-card sm:p-3">
                <button
                  type="button"
                  onClick={() => openMedia(src)}
                  className="group block w-full overflow-hidden rounded-xl"
                  aria-label={`Открыть фотографию ${galleryIndex + 1}`}
                >
                  <SafeImage src={src} alt={`Фотография ${galleryIndex + 1}: ${project.title}`} className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-[1.03]" fallbackClassName="aspect-[4/3] w-full" />
                </button>
                <div className="mt-2 flex items-center justify-between px-1 pb-1 text-xs text-graphite-muted">
                  <span>Фото {galleryIndex + 1}</span>
                  <span className="font-semibold text-accent">Открыть</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Блок сведений об авторе и материале */}
      <dl className="grid gap-5 border-t border-stone-line p-5 sm:grid-cols-2 sm:p-8 md:p-10 lg:grid-cols-3">
        <div>
          <dt className="kicker text-graphite-muted">Автор</dt>
          <dd className="mt-1 font-semibold text-graphite">{project.author || 'Не указан'}</dd>
          {project.author_role && <dd className="mt-1 text-sm text-graphite-soft">{project.author_role}</dd>}
        </div>
        {project.project_date && <div><dt className="kicker text-graphite-muted">Дата / период</dt><dd className="mt-1 flex items-center gap-2 text-graphite-soft"><CalendarDays className="size-4" />{project.project_date}</dd></div>}
        {project.source_info && <div><dt className="kicker text-graphite-muted">Источник</dt><dd className="mt-1 text-graphite-soft">{project.source_info}</dd></div>}
      </dl>
    </article>
    <nav className="mt-6 grid gap-3 sm:grid-cols-2" aria-label="Навигация по проектам">{previous ? <a href={`#/project/${previous.id}`} className="flex items-center gap-3 rounded-xl border border-stone-line bg-stone p-4 hover:border-graphite-muted"><ArrowLeft className="size-5 shrink-0 text-accent" /><span><span className="block text-xs text-graphite-muted">Предыдущий проект</span><span className="mt-1 block font-semibold text-graphite">{previous.title}</span></span></a> : <span />}{next ? <a href={`#/project/${next.id}`} className="flex items-center justify-end gap-3 rounded-xl border border-stone-line bg-stone p-4 text-right hover:border-graphite-muted"><span><span className="block text-xs text-graphite-muted">Следующий проект</span><span className="mt-1 block font-semibold text-graphite">{next.title}</span></span><ArrowRight className="size-5 shrink-0 text-accent" /></a> : <span />}</nav>
    {similar.length > 0 && <section className="mt-10"><div className="mb-5"><p className="kicker text-kicker">продолжить знакомство</p><h2 className="display-title mt-2 text-2xl text-graphite">Похожие проекты</h2></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{similar.map((item) => <PublicProjectCard key={item.id} project={item} />)}</div></section>}

    {/* Модальное окно просмотра: переключение стрелками или клавиатурой */}
    <MediaLightbox
      items={mediaItems}
      index={viewerIndex}
      onIndexChange={setViewerIndex}
      onClose={() => setViewerIndex(-1)}
    />
    </div>

    <SiteFooter />
  </>
}
