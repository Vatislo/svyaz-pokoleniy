import { ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SafeImage } from '@/components/SafeImage'

const typeNames = { photo: 'Фотография', story: 'Текст', video: 'Видео', gif: 'GIF-анимация', pair: 'Тогда / сейчас', other: 'Другое' }

export function PublicProjectCard({ project }) {
  const tags = Array.isArray(project.tags) ? project.tags : []
  const photoCount = Array.isArray(project.gallery) ? project.gallery.length : 0
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[14px] border border-stone-line bg-stone transition-all duration-200 hover:-translate-y-[3px] hover:border-graphite-muted hover:shadow-card">
      <a href={`#/project/${project.id}`} className="relative block aspect-[4/3] overflow-hidden bg-stone-deep" aria-label={`Открыть проект: ${project.title}`}>
        {project.image_url ? <SafeImage src={project.image_url} alt={project.title} className="absolute inset-0 size-full transition-transform duration-300 group-hover:scale-[1.03]" fallbackClassName="absolute inset-0" /> : <div className="absolute inset-0 flex items-center justify-center text-graphite-muted">Материал без обложки</div>}
        <Badge className="pill absolute top-3 left-3 bg-graphite/85 px-2.5 text-[0.72rem] font-semibold tracking-[0.08em] text-stone uppercase backdrop-blur-sm">{typeNames[project.project_type] || 'Проект'}</Badge>
        {photoCount > 0 && <Badge className="pill absolute top-3 right-3 bg-stone/90 px-2.5 text-[0.72rem] font-semibold tracking-[0.08em] text-graphite uppercase backdrop-blur-sm">{photoCount} фото</Badge>}
      </a>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[0.7rem] font-semibold tracking-[0.1em] text-accent uppercase">{project.topic_title || 'Материал участника'}</p>
        <h3 className="display-title text-lg text-graphite"><a href={`#/project/${project.id}`} className="hover:text-accent">{project.title}</a></h3>
        <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-graphite-soft">{project.description}</p>
        {tags.length > 0 && <div className="flex flex-wrap gap-1.5 pt-1">{tags.slice(0, 4).map((tag) => <a key={tag} href={`#/catalog?tag=${encodeURIComponent(tag)}`} className="rounded-full bg-stone-deep px-2 py-1 text-xs text-graphite-soft hover:bg-accent/10 hover:text-accent">#{tag}</a>)}</div>}
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-stone-line pt-3"><span className="truncate text-xs text-graphite-muted">{project.author || 'Автор не указан'}</span><a href={`#/project/${project.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-accent">Читать <ArrowUpRight className="size-4" /></a></div>
      </div>
    </article>
  )
}
