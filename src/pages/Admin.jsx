import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const filters = [
  { value: 'pending', label: 'На рассмотрении' },
  { value: 'approved', label: 'Опубликованные' },
  { value: 'deleted', label: 'Удалённые' },
  { value: 'all', label: 'Все проекты' },
]

const statusLabels = {
  pending: 'На рассмотрении',
  approved: 'Опубликован',
  deleted: 'Удалён',
}

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [projects, setProjects] = useState([])
  const [filter, setFilter] = useState('pending')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [loggingIn, setLoggingIn] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editCover, setEditCover] = useState(null)

  // Проверка авторизации
  useEffect(() => {
    let cancelled = false

    async function checkAuth() {
      try {
        const result = await api('/api/auth/me')

        if (!cancelled) {
          setAuthenticated(Boolean(result?.authenticated))
        }
      } catch {
        if (!cancelled) {
          setAuthenticated(false)
        }
      } finally {
        if (!cancelled) {
          setChecking(false)
        }
      }
    }

    checkAuth()

    return () => {
      cancelled = true
    }
  }, [])

  // Загрузка проектов после входа
  useEffect(() => {
    if (!authenticated) return

    let cancelled = false

    async function loadProjects() {
      try {
        setError('')

        const result = await api('/api/admin/projects')

        if (!cancelled) {
          setProjects(Array.isArray(result) ? result : [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Не удалось загрузить проекты')
        }
      }
    }

    loadProjects()

    return () => {
      cancelled = true
    }
  }, [authenticated])

  // Вход в админ-панель
  async function login(event) {
    event.preventDefault()
    setError('')
    setLoggingIn(true)

    try {
      await api('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      })

      setPassword('')
      setAuthenticated(true)
      // Хедер узнаёт о входе и меняет «Вход» на «Администрирование»
      window.dispatchEvent(new Event('auth-changed'))
    } catch (err) {
      setError(err.message || 'Не удалось войти. Проверь логин и пароль.')
    } finally {
      setLoggingIn(false)
    }
  }

  // Выход
  async function logout() {
    setError('')

    try {
      await api('/api/auth/logout', {
        method: 'POST',
      })
    } catch (err) {
      setError(err.message || 'Не удалось завершить сеанс')
    } finally {
      setAuthenticated(false)
      setProjects([])
      setPassword('')
      window.dispatchEvent(new Event('auth-changed'))
    }
  }

  // Одобрение, удаление и восстановление
  async function action(id, type) {
    setError('')
    setBusyId(id)

    try {
      await api(`/api/admin/projects/${id}/${type}`, {
        method: 'PATCH',
      })

      // Обновляем список после изменения статуса
      const result = await api('/api/admin/projects')
      setProjects(Array.isArray(result) ? result : [])
    } catch (err) {
      setError(err.message || 'Не удалось изменить проект')
    } finally {
      setBusyId(null)
    }
  }

  function beginEdit(project) {
    setEditingId(project.id)
    setEditCover(null)
    setEditForm({
      title: project.title || '',
      description: project.description || '',
      author: project.author || '',
      author_role: project.author_role || '',
      email: project.email || '',
      topic: project.topic || 'school',
      project_type: project.project_type || 'photo',
      project_date: project.project_date || '',
      source_info: project.source_info || '',
      tags: (project.tags || []).join(', '),
    })
  }

  function updateEdit(key, value) {
    setEditForm((current) => ({ ...current, [key]: value }))
  }

  async function saveEdit(event, id) {
    event.preventDefault()
    setError('')
    setBusyId(id)
    try {
      const body = new FormData()
      for (const [key, value] of Object.entries(editForm)) body.append(key, value)
      if (editCover) body.append('image', editCover)
      await api(`/api/admin/projects/${id}`, { method: 'PATCH', body })
      const result = await api('/api/admin/projects')
      setProjects(Array.isArray(result) ? result : [])
      setEditingId(null)
      setEditCover(null)
    } catch (err) {
      setError(err.message || 'Не удалось сохранить изменения проекта')
    } finally {
      setBusyId(null)
    }
  }

  async function permanentlyDelete(project) {
    const confirmed = window.confirm(`Безвозвратно удалить «${project.title || 'Без названия'}»? Это действие нельзя отменить.`)
    if (!confirmed) return
    setError('')
    setBusyId(project.id)
    try {
      await api(`/api/admin/projects/${project.id}/permanent`, { method: 'DELETE' })
      setProjects((current) => current.filter((item) => item.id !== project.id))
    } catch (err) {
      setError(err.message || 'Не удалось удалить проект навсегда')
    } finally {
      setBusyId(null)
    }
  }

  const visibleProjects = projects.filter(
    (project) => filter === 'all' || project.status === filter,
  )

  // Проверка авторизации
  if (checking) {
    return (
      <main className="container mx-auto px-4 py-16">
        <p className="text-center text-muted-foreground">
          Проверка входа…
        </p>
      </main>
    )
  }

  // Форма входа
  if (!authenticated) {
    return (
      <main className="container mx-auto max-w-md px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Вход администратора</CardTitle>
            <p className="text-sm text-muted-foreground">
              Войдите, чтобы управлять пользовательскими проектами.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={login} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-username"
                  className="mb-2 block text-sm font-medium"
                >
                  Логин
                </label>

                <Input
                  id="admin-username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="mb-2 block text-sm font-medium"
                >
                  Пароль
                </label>

                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loggingIn}
              >
                {loggingIn ? 'Входим…' : 'Войти'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    )
  }

  // Панель управления проектами
  return (
    <main className="container mx-auto space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Управление проектами
          </h1>

          <p className="text-muted-foreground">
            Проверка заявок, публикация и восстановление проектов
          </p>
        </div>

        <Button variant="outline" onClick={logout}>
          Выйти
        </Button>
      </div>

      {error && (
        <div
          className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Фильтры */}
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <Button
            key={item.value}
            type="button"
            variant={filter === item.value ? 'default' : 'outline'}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
            {item.value !== 'all' && (
              <span className="ml-2 opacity-70">
                {projects.filter(
                  (project) => project.status === item.value,
                ).length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Список проектов */}
      {visibleProjects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              В этой категории проектов пока нет.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleProjects.map((project) => {
            const busy = busyId === project.id

            return (
              <Card key={project.id} className="overflow-hidden">
                {project.image_url && (
                  <img
                    src={project.image_url}
                    alt={project.title || 'Изображение проекта'}
                    className="h-52 w-full object-cover"
                    loading="lazy"
                  />
                )}

                <CardHeader>
                  <CardTitle className="break-words">
                    {project.title || 'Без названия'}
                  </CardTitle>

                  <p className="text-sm text-muted-foreground">
                    Автор: {project.author || 'Не указан'}{project.author_role ? ` · ${project.author_role}` : ''}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Формат: {{ photo: 'Фотография', story: 'Текст', video: 'Видео', gif: 'GIF-анимация', pair: 'Тогда / сейчас', other: 'Другое' }[project.project_type] || 'Фотография'}
                    {project.topic_title ? ` · ${project.topic_title}` : ''}
                  </p>

                  {project.email && (
                    <p className="break-all text-sm text-muted-foreground">
                      Контакт: {project.email}
                    </p>
                  )}

                  <p className="text-sm">
                    Статус:{' '}
                    <span className="font-semibold">
                      {statusLabels[project.status] || project.status}
                    </span>
                  </p>

                  {project.project_date && <p className="text-sm text-muted-foreground">Дата материала: {project.project_date}</p>}
                  {project.source_info && <p className="text-sm text-muted-foreground">Источник: {project.source_info}</p>}

                  {project.created_at && (
                    <p className="text-xs text-muted-foreground">
                      Дата подачи:{' '}
                      {new Date(project.created_at).toLocaleString('ru-RU')}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {editingId === project.id ? (
                    <form className="space-y-3" onSubmit={(event) => saveEdit(event, project.id)}>
                      <div><label className="mb-1 block text-sm font-medium">Заголовок</label><Input required maxLength={200} value={editForm.title || ''} onChange={(event) => updateEdit('title', event.target.value)} /></div>
                      <div><label className="mb-1 block text-sm font-medium">Описание / текст</label><textarea required rows={5} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editForm.description || ''} onChange={(event) => updateEdit('description', event.target.value)} /></div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div><label className="mb-1 block text-sm font-medium">Автор</label><Input required value={editForm.author || ''} onChange={(event) => updateEdit('author', event.target.value)} /></div>
                        <div><label className="mb-1 block text-sm font-medium">Роль автора</label><Input value={editForm.author_role || ''} onChange={(event) => updateEdit('author_role', event.target.value)} /></div>
                        <div><label className="mb-1 block text-sm font-medium">E-mail</label><Input type="email" value={editForm.email || ''} onChange={(event) => updateEdit('email', event.target.value)} /></div>
                        <div><label className="mb-1 block text-sm font-medium">Дата / период</label><Input value={editForm.project_date || ''} onChange={(event) => updateEdit('project_date', event.target.value)} placeholder="Дата или период" /></div>
                        <div><label className="mb-1 block text-sm font-medium">Раздел</label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={editForm.topic || 'school'} onChange={(event) => updateEdit('topic', event.target.value)}>{[['school','Школа'],['family','Семья'],['people','Люди'],['places','Места'],['objects','Предметы'],['creative','Творчество']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                        <div><label className="mb-1 block text-sm font-medium">Тип материала</label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={editForm.project_type || 'photo'} onChange={(event) => updateEdit('project_type', event.target.value)}>{[['photo','Фотография'],['story','Текст'],['video','Видео'],['gif','GIF'],['pair','Тогда / сейчас'],['other','Другое']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                      </div>
                      <div><label className="mb-1 block text-sm font-medium">Источник</label><Input value={editForm.source_info || ''} onChange={(event) => updateEdit('source_info', event.target.value)} /></div>
                      <div><label className="mb-1 block text-sm font-medium">Теги (через запятую)</label><Input value={editForm.tags || ''} onChange={(event) => updateEdit('tags', event.target.value)} /></div>
                      <div><label className="mb-1 block text-sm font-medium">Новая обложка (необязательно)</label><input type="file" accept="image/*" onChange={(event) => setEditCover(event.target.files?.[0] || null)} className="block w-full text-sm" /></div>
                      <div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy}>Сохранить изменения</Button><Button type="button" variant="outline" disabled={busy} onClick={() => { setEditingId(null); setEditCover(null) }}>Отмена</Button></div>
                    </form>
                  ) : <>
                  <p className="whitespace-pre-wrap break-words">
                    {project.description || 'Описание отсутствует.'}
                  </p>
                  {Array.isArray(project.tags) && project.tags.length > 0 && <p className="text-sm text-muted-foreground">Теги: {project.tags.map((tag) => `#${tag}`).join(' ')}</p>}

                  {/* Приложенные файлы: показываем миниатюрами, чтобы их было видно до одобрения */}
                  {(project.media_url || project.before_image_url || project.after_image_url || (Array.isArray(project.gallery) && project.gallery.length > 0)) && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Приложенные файлы</p>
                      {project.before_image_url && (
                        <figure className="inline-block w-[45%] min-w-40 align-top">
                          <a href={project.before_image_url} target="_blank" rel="noreferrer">
                            <img src={project.before_image_url} alt="Фото «тогда»" className="h-28 w-full rounded-md border object-cover" loading="lazy" />
                          </a>
                          <figcaption className="mt-1 text-xs text-muted-foreground">Фото «тогда»</figcaption>
                        </figure>
                      )}
                      {project.after_image_url && (
                        <figure className="inline-block w-[45%] min-w-40 align-top">
                          <a href={project.after_image_url} target="_blank" rel="noreferrer">
                            <img src={project.after_image_url} alt="Фото «сейчас»" className="h-28 w-full rounded-md border object-cover" loading="lazy" />
                          </a>
                          <figcaption className="mt-1 text-xs text-muted-foreground">Фото «сейчас»</figcaption>
                        </figure>
                      )}
                      {Array.isArray(project.gallery) && project.gallery.length > 0 && (
                        <ul className="flex flex-wrap gap-2">
                          {project.gallery.map((url, galleryIndex) => (
                            <li key={url}>
                              <a href={url} target="_blank" rel="noreferrer" title={`Открыть фотографию ${galleryIndex + 1}`}>
                                <img src={url} alt={`Приложенная фотография ${galleryIndex + 1}`} className="h-20 w-20 rounded-md border object-cover" loading="lazy" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                      {project.media_url && (/\.mp4($|\?)/i.test(project.media_url)
                        ? <video src={project.media_url} controls preload="metadata" className="max-h-40 rounded-md border" />
                        : /\.(gif|jpe?g|png|webp|avif)($|\?)/i.test(project.media_url)
                          ? <a href={project.media_url} target="_blank" rel="noreferrer"><img src={project.media_url} alt="Прикреплённый файл" className="h-28 rounded-md border object-cover" loading="lazy" /></a>
                          : <a className="underline" href={project.media_url} target="_blank" rel="noreferrer">Открыть файл материала</a>)}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" disabled={busy} onClick={() => beginEdit(project)}>Редактировать карточку</Button>
                    {/* Одобрить или опубликовать */}
                    {project.status === 'pending' && (
                      <Button
                        type="button"
                        disabled={busy}
                        onClick={() => action(project.id, 'approve')}
                      >
                        {busy ? 'Обработка…' : 'Одобрить и опубликовать'}
                      </Button>
                    )}

                    {/* Восстановить удалённый проект */}
                    {project.status === 'deleted' ? (
                      <>
                        <Button type="button" variant="outline" disabled={busy} onClick={() => action(project.id, 'restore')}>Восстановить и опубликовать</Button>
                        <Button type="button" variant="destructive" disabled={busy} onClick={() => permanentlyDelete(project)}>Удалить навсегда</Button>
                      </>
                    ) : (
                      <Button type="button" variant="destructive" disabled={busy} onClick={() => action(project.id, 'delete')}>Удалить</Button>
                    )}
                  </div>
                  </>}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </main>
  )
}
