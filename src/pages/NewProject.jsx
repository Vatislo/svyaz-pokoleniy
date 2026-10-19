import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, ImagePlus, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import content from '@/data/content.json'

const projectTypes = [
  { value: 'photo', label: 'Фотография', hint: 'Один снимок с историей' },
  { value: 'story', label: 'Текст', hint: 'Воспоминание, интервью или рассказ' },
  { value: 'video', label: 'Видео', hint: 'Видеоролик или интервью' },
  { value: 'gif', label: 'GIF-анимация', hint: 'Короткая анимация' },
  { value: 'pair', label: 'Тогда / сейчас', hint: 'Два снимка одного места: как было и как стало' },
  { value: 'other', label: 'Другое', hint: 'Рисунок, аудио, предмет и т. п.' },
]
const suggestedTags = ['семья', 'школа', 'воспоминания', 'тогда-и-сейчас', 'традиции', 'выпускники', 'история', 'люди', 'памятное-место']
const fieldClass = 'mt-2 min-h-11 rounded-xl border-stone-line bg-stone px-3 text-graphite'
const labelClass = 'block text-sm font-semibold text-graphite'
const MAX_PHOTOS = 12

// Черновик формы живёт вне компонента: страница создаётся заново при каждом
// переходе на неё, а черновик переживает такие переходы до самой перезагрузки
// страницы. После успешной отправки черновик очищается.
function createDraft() {
  return {
    step: 0,
    type: 'photo',
    form: { topic: 'school', title: '', description: '', author: '', author_role: '', email: '', project_date: '', date_mode: 'exact', project_date_from: '', project_date_to: '', source_info: '', tags: ['школа'] },
    customTags: '',
    cover: null,
    media: null,
    beforeImage: null,
    afterImage: null,
    photos: [],
  }
}
const draft = createDraft()

function FileField({ label, accept, file, onChange, required = false, hint }) {
  return (
    <label className="flex cursor-pointer flex-col gap-2 rounded-xl border border-dashed border-stone-line bg-stone-deep/60 p-4 transition-colors hover:border-accent">
      <span className="flex items-center gap-2 text-sm font-semibold text-graphite"><ImagePlus className="size-4 text-accent" />{label}{required ? ' *' : ''}</span>
      <span className="text-xs leading-relaxed text-graphite-muted">{file?.name || hint || 'Нажмите, чтобы выбрать файл'}</span>
      {/* required не ставим на сам input: после возврата на страницу из черновика
          файл есть в состоянии, но браузер его «не видит» и блокирует отправку.
          Проверку делает JS в nextStep/submitProject. */}
      <input type="file" accept={accept} className="sr-only" onChange={(event) => onChange(event.target.files?.[0] || null)} />
    </label>
  )
}

// Поле для нескольких фотографий: файлы выбираются группой,
// убрать лишние можно крестиком на превью.
function PhotosField({ label, hint, photos, previews, onChange }) {
  const append = (event) => {
    const picked = Array.from(event.target.files || [])
    if (picked.length === 0) return
    onChange([...photos, ...picked].slice(0, MAX_PHOTOS))
    // Сбрасываем input, чтобы можно было выбрать те же файлы повторно
    event.target.value = ''
  }

  const remove = (index) => onChange(photos.filter((_, i) => i !== index))

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-stone-line bg-stone-deep/60 p-4 transition-colors focus-within:border-accent">
      <label className="flex cursor-pointer flex-col gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-graphite"><ImagePlus className="size-4 text-accent" />{label}</span>
        <span className="text-xs leading-relaxed text-graphite-muted">{hint}</span>
        <input type="file" accept="image/*" multiple className="sr-only" onChange={append} />
      </label>

      {photos.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo, index) => (
            <li key={`${photo.name}-${index}-${photo.lastModified}`} className="relative aspect-square overflow-hidden rounded-lg border border-stone-line bg-stone">
              <img src={previews[index]} alt={`Фотография ${index + 1}: ${photo.name}`} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={`Убрать фотографию ${index + 1}`}
                title="Убрать фотографию"
                className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-graphite/85 text-sm font-bold text-stone transition-colors hover:bg-graphite"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {photos.length > 0 && (
        <p className="text-xs text-graphite-muted">Выбрано фотографий: {photos.length} из {MAX_PHOTOS}</p>
      )}
    </div>
  )
}

export function NewProject() {
  // Инициализируемся из черновика, чтобы уход со страницы и возврат
  // на неё не сбрасывали обложку, файлы и введённый текст.
  const [step, setStep] = useState(draft.step)
  const [type, setType] = useState(draft.type)
  const [form, setForm] = useState(draft.form)
  const [customTags, setCustomTags] = useState(draft.customTags)
  const [cover, setCover] = useState(draft.cover)
  const [media, setMedia] = useState(draft.media)
  const [beforeImage, setBeforeImage] = useState(draft.beforeImage)
  const [afterImage, setAfterImage] = useState(draft.afterImage)
  const [photos, setPhotos] = useState(draft.photos)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  // Сохраняем состояние в черновик при каждом изменении.
  useEffect(() => {
    draft.step = step
    draft.type = type
    draft.form = form
    draft.customTags = customTags
    draft.cover = cover
    draft.media = media
    draft.beforeImage = beforeImage
    draft.afterImage = afterImage
    draft.photos = photos
  }, [step, type, form, customTags, cover, media, beforeImage, afterImage, photos])

  const [coverPreview, setCoverPreview] = useState('')
  useEffect(() => {
    if (!cover) { setCoverPreview(''); return undefined }
    const url = URL.createObjectURL(cover)
    setCoverPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [cover])

  const photoPreviews = useMemo(() => photos.map((file) => URL.createObjectURL(file)), [photos])

  useEffect(() => () => photoPreviews.forEach((url) => URL.revokeObjectURL(url)), [photoPreviews])

  const selectedTopic = useMemo(() => content.sections.find((item) => item.id === form.topic)?.title || 'Другое', [form.topic])
  const allTags = useMemo(() => [...new Set([...form.tags, ...customTags.split(/[\s,;]+/).map((tag) => tag.replace(/^#+/, '').trim()).filter(Boolean)])], [form.tags, customTags])
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const toggleTag = (tag) => update('tags', form.tags.includes(tag) ? form.tags.filter((item) => item !== tag) : [...form.tags, tag])

  function nextStep(event) {
    event.preventDefault()
    setError('')
    if (step === 0 && (!form.title.trim() || !cover)) {
      setError('Укажи заголовок и добавь обложку проекта.')
      return
    }
    if (step === 1 && !form.description.trim()) {
      setError('Добавь описание или текст проекта.')
      return
    }
    setStep((value) => Math.min(2, value + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submitProject(event) {
    event.preventDefault()
    setError('')
    if (!form.author.trim()) {
      setError('Укажи имя автора, чтобы администратор мог подписать работу.')
      return
    }
    if (['video', 'gif'].includes(type) && !media) {
      setError('Для выбранного формата добавь файл проекта.')
      return
    }
    if (type === 'pair' && (!beforeImage || !afterImage)) {
      setError('Для сравнения «тогда / сейчас» добавь обе фотографии.')
      return
    }
    if (photos.length > MAX_PHOTOS) {
      setError(`Можно приложить не более ${MAX_PHOTOS} фотографий.`)
      return
    }
    if (photos.some((file) => file.size > 8 * 1024 * 1024)) {
      setError('Каждая фотография не должна превышать 8 МБ.')
      return
    }
    const body = new FormData()
    body.append('project_type', type)
    body.append('topic', form.topic)
    body.append('title', form.title.trim())
    body.append('description', form.description.trim())
    body.append('author', form.author.trim())
    body.append('author_role', form.author_role.trim())
    body.append('email', form.email.trim())
    body.append('project_date', form.project_date.trim())
    body.append('source_info', form.source_info.trim())
    body.append('tags', JSON.stringify(allTags))
    if (cover) body.append('image', cover)
    photos.forEach((file) => body.append('images', file))
    if (media) body.append('media', media)
    if (beforeImage) body.append('beforeImage', beforeImage)
    if (afterImage) body.append('afterImage', afterImage)
    setSending(true)
    try {
      await api('/api/projects', { method: 'POST', body })
      setSent(true)
      // Отправка прошла: черновик больше не нужен.
      Object.assign(draft, createDraft())
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message || 'Не получилось отправить проект. Попробуй ещё раз.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return <div className="shell py-16 md:py-24"><section className="mx-auto flex max-w-2xl flex-col items-center gap-5 rounded-2xl border border-stone-line bg-stone p-8 text-center md:p-12"><CheckCircle2 className="size-14 text-accent" /><p className="kicker text-kicker">заявка отправлена</p><h1 className="display-title text-3xl text-graphite">Спасибо, что сохраняешь память</h1><p className="leading-relaxed text-graphite-soft">Проект передан администратору на проверку. Он появится в каталоге после одобрения и публикации.</p><div className="flex flex-wrap justify-center gap-3"><Button asChild className="pill"><a href="#/catalog">Перейти в каталог</a></Button><Button asChild variant="outline" className="pill"><a href="#/">На главную</a></Button></div></section></div>
  }

  return (
    <div className="shell max-w-5xl py-10 md:py-14">
      <a href="#/catalog" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-graphite-soft hover:text-accent"><ArrowLeft className="size-4" /> Вернуться в каталог</a>
      <header className="mb-8 max-w-3xl"><p className="kicker text-kicker">участвуйте в архиве</p><h1 className="display-title mt-3 text-[clamp(2rem,5vw,3.2rem)] text-graphite">Создать проект</h1><p className="mt-3 leading-relaxed text-graphite-soft">Расскажи историю, добавь фотографии и подпиши важные детали. Сначала проект увидит администратор, в открытый каталог попадают только одобренные работы.</p></header>
      <div className="mb-8 grid grid-cols-3 gap-2" aria-label="Шаги создания проекта">{['Материал', 'История', 'Автор и отправка'].map((name, index) => <div key={name} className={`rounded-xl border p-3 text-center text-xs font-semibold sm:text-sm ${step === index ? 'border-graphite bg-graphite text-stone' : step > index ? 'border-accent/40 bg-accent/10 text-accent' : 'border-stone-line bg-stone-deep text-graphite-muted'}`}><span className="mr-1.5">{String(index + 1).padStart(2, '0')}</span>{name}</div>)}</div>
      <form onSubmit={step < 2 ? nextStep : submitProject} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0 rounded-2xl border border-stone-line bg-stone p-5 sm:p-7">
          {step === 0 && <div className="flex flex-col gap-6"><div><h2 className="display-title text-2xl text-graphite">Что ты хочешь сохранить?</h2><p className="mt-2 text-sm text-graphite-soft">Выбери формат, форма подстроится под него.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{projectTypes.map((item) => <button key={item.value} type="button" onClick={() => setType(item.value)} className={`rounded-xl border p-4 text-left transition-colors ${type === item.value ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-stone-line hover:border-graphite-muted'}`}><span className="block font-semibold text-graphite">{item.label}</span><span className="mt-1 block text-xs leading-relaxed text-graphite-muted">{item.hint}</span></button>)}</div></div><div><label className={labelClass} htmlFor="topic">Тема / раздел *</label><select id="topic" value={form.topic} onChange={(e) => update('topic', e.target.value)} className={`w-full ${fieldClass}`}>{content.sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}</select></div><div><label className={labelClass} htmlFor="title">Заголовок проекта *</label><Input id="title" required maxLength={200} value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Например: История школьного двора" className={fieldClass} /></div><FileField label="Обложка проекта" accept="image/*" file={cover} onChange={setCover} required={true} hint="JPG, PNG, WEBP, до 8 МБ" /><PhotosField label="Дополнительные фотографии (можно выбрать сразу несколько)" hint={`Файлы можно выбрать группой, до ${MAX_PHOTOS} штук, JPG, PNG или WEBP до 8 МБ каждая`} photos={photos} previews={photoPreviews} onChange={setPhotos} />{type === 'pair' && <div className="grid gap-3 sm:grid-cols-2"><FileField label="Фотография «тогда»" accept="image/*" file={beforeImage} onChange={setBeforeImage} required={true} hint="Как это выглядело раньше" /><FileField label="Фотография «сейчас»" accept="image/*" file={afterImage} onChange={setAfterImage} required={true} hint="Как это выглядит сейчас" /></div>}{['video', 'gif', 'other'].includes(type) && <FileField label={type === 'video' ? 'Видеофайл' : type === 'gif' ? 'GIF-файл' : 'Файл материала (если есть)'} accept={type === 'video' ? 'video/*' : type === 'gif' ? 'image/gif' : 'image/*,video/*,audio/*,.pdf'} file={media} onChange={setMedia} required={type === 'video' || type === 'gif'} hint={type === 'video' ? 'MP4 или WebM' : type === 'gif' ? 'GIF до 8 МБ' : 'Аудио, PDF или другой файл'} />}</div>}
          {step === 1 && <div className="flex flex-col gap-6"><div><h2 className="display-title text-2xl text-graphite">Расскажи историю</h2><p className="mt-2 text-sm text-graphite-soft">Добавь подробности, которые помогут другим понять значение материала.</p></div><div><label className={labelClass} htmlFor="description">Описание / текст проекта *</label><textarea id="description" required rows={10} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Что изображено? Кто эти люди? Почему эта история важна?" className={`w-full resize-y ${fieldClass} py-3`} /></div><div><p className={labelClass}>Теги: выбери подходящие</p><div className="mt-3 flex flex-wrap gap-2">{suggestedTags.map((tag) => <button type="button" key={tag} onClick={() => toggleTag(tag)} className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${form.tags.includes(tag) ? 'border-graphite bg-graphite text-stone' : 'border-stone-line text-graphite-soft hover:border-graphite-muted'}`}>#{tag}</button>)}</div><label className={`${labelClass} mt-5`} htmlFor="custom-tags">Свои теги</label><Input id="custom-tags" value={customTags} onChange={(e) => setCustomTags(e.target.value)} placeholder="например: выпуск-1982, семейный-архив" className={fieldClass} /><p className="mt-2 text-xs text-graphite-muted">Разделяй теги пробелами или запятыми. В каталоге по ним можно будет найти проект.</p></div><div><label className={labelClass} htmlFor="source-info">Источник / откуда материал (необязательно)</label><Input id="source-info" value={form.source_info} onChange={(e) => update('source_info', e.target.value)} placeholder="Семейный альбом, школьный музей…" className={fieldClass} /></div></div>}
          {step === 2 && <div className="flex flex-col gap-6"><div><h2 className="display-title text-2xl text-graphite">Информация об авторе</h2><p className="mt-2 text-sm text-graphite-soft">Контактные данные видны администратору для связи. Публично выводятся имя и указанная роль.</p></div><div><label className={labelClass} htmlFor="author">Имя и фамилия *</label><Input id="author" required maxLength={150} value={form.author} onChange={(e) => update('author', e.target.value)} placeholder="Как подписать работу" className={fieldClass} /></div><div><label className={labelClass} htmlFor="author-role">Кто ты / роль автора</label><Input id="author-role" value={form.author_role} onChange={(e) => update('author_role', e.target.value)} placeholder="Например: выпускница 2004 года" className={fieldClass} /></div><div><label className={labelClass} htmlFor="email">Контактный e-mail</label><Input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="name@example.com" className={fieldClass} /></div><div><label className={labelClass} htmlFor="project-date">Дата / период материала</label><div className="mt-2 flex flex-wrap gap-2">
  <button type="button" onClick={() => { update('date_mode', 'exact'); update('project_date', form.project_date_from || '') }} className={`rounded-full border px-3 py-1.5 text-sm ${form.date_mode !== 'period' ? 'border-graphite bg-graphite text-stone' : 'border-stone-line text-graphite-soft'}`}>Точная дата</button>
  <button type="button" onClick={() => { update('date_mode', 'period'); if (form.project_date && /^\d{4}-\d{2}-\d{2}$/.test(form.project_date)) update('project_date_from', form.project_date) }} className={`rounded-full border px-3 py-1.5 text-sm ${form.date_mode === 'period' ? 'border-graphite bg-graphite text-stone' : 'border-stone-line text-graphite-soft'}`}>Период</button>
</div>
{form.date_mode === 'period' ? <div className="mt-3 grid gap-3 sm:grid-cols-2"><div><label className={labelClass} htmlFor="project-date-from">С даты</label><Input id="project-date-from" type="date" value={form.project_date_from || ''} onChange={(e) => { const from = e.target.value; update('project_date_from', from); update('project_date', [from, form.project_date_to].filter(Boolean).join(' - ')) }} className={fieldClass} /></div><div><label className={labelClass} htmlFor="project-date-to">По дату</label><Input id="project-date-to" type="date" min={form.project_date_from || undefined} value={form.project_date_to || ''} onChange={(e) => { const to = e.target.value; update('project_date_to', to); update('project_date', [form.project_date_from, to].filter(Boolean).join(' - ')) }} className={fieldClass} /></div></div> : <Input id="project-date" type="date" value={form.project_date || ''} onChange={(e) => update('project_date', e.target.value)} className={fieldClass} />}</div><label className="flex items-start gap-3 text-sm leading-relaxed text-graphite-soft"><input type="checkbox" required className="mt-1 accent-accent" />Подтверждаю, что имею право отправлять этот материал и согласен(на) на его публикацию после проверки администратором.</label></div>}
          {error && <p role="alert" className="mt-6 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-stone-line pt-5">{step > 0 ? <Button type="button" variant="outline" onClick={() => { setError(''); setStep((value) => value - 1) }} className="pill gap-2"><ArrowLeft className="size-4" />Предыдущий шаг</Button> : <span />}{step < 2 ? <Button type="submit" className="pill gap-2">Следующий шаг<ArrowRight className="size-4" /></Button> : <Button type="submit" disabled={sending} className="pill gap-2">{sending ? 'Отправляем…' : 'Отправить админу'}<Send className="size-4" /></Button>}</div>
        </section>
        <aside className="flex h-fit flex-col gap-4 rounded-2xl border border-stone-line bg-stone-deep/70 p-5"><p className="kicker text-kicker">предпросмотр</p><div className="aspect-[4/3] overflow-hidden rounded-xl border border-stone-line bg-stone">{coverPreview ? <img src={coverPreview} alt="Предпросмотр обложки" className="size-full object-cover" /> : <div className="flex size-full flex-col items-center justify-center gap-2 text-graphite-muted"><ImagePlus className="size-8" /><span className="text-xs">Здесь будет обложка</span></div>}</div><p className="text-xs font-semibold uppercase tracking-wider text-accent">{selectedTopic} · {projectTypes.find((item) => item.value === type)?.label}</p><h3 className="display-title text-xl text-graphite">{form.title || 'Название твоего проекта'}</h3><p className="line-clamp-4 text-sm leading-relaxed text-graphite-soft">{form.description || 'Здесь появится описание истории.'}</p><div className="flex flex-wrap gap-1.5">{allTags.slice(0, 6).map((tag) => <span key={tag} className="rounded-full bg-stone px-2 py-1 text-xs text-graphite-soft">#{tag}</span>)}</div><p className="border-t border-stone-line pt-3 text-xs leading-relaxed text-graphite-muted">После отправки работа получит статус «На рассмотрении». До одобрения она не видна посетителям каталога.</p></aside>
      </form>
    </div>
  )
}
