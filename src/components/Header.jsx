import { useEffect, useState } from 'react'
import { Menu, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { cn } from 'cn'
import { useTheme } from '@/lib/theme'
import { api } from '@/lib/api'
import content from '@/data/content.json'

function ThemeToggle({ className }) {
  const { theme, toggle } = useTheme()

  const label =
    theme === 'dark'
      ? content.ui.themeLight
      : content.ui.themeDark

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={theme === 'dark'}
      aria-label={`${content.ui.themeToggle}: ${label}`}
      title={`${content.ui.themeToggle}: ${label}`}
      className={cn(
        'inline-flex size-[38px] shrink-0 items-center justify-center rounded-full border border-stone-line bg-stone/70 text-graphite-soft transition-colors hover:border-graphite-muted hover:bg-stone-deep hover:text-graphite',
        className,
      )}
    >
      {theme === 'dark' ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </button>
  )
}

function navLinkClass(active) {
  return cn(
    'inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold transition-colors',
    active
      ? 'bg-graphite text-stone'
      : 'border border-transparent text-graphite-soft hover:border-stone-line hover:bg-stone-deep hover:text-graphite',
  )
}

export function Header({ path }) {
  const [open, setOpen] = useState(false)
  // Админ вошёл в систему? Проверяем сессию и слушаем событие,
  // которое страница администратора шлёт после входа и выхода.
  const [adminAuthed, setAdminAuthed] = useState(false)

  useEffect(() => {
    let cancelled = false

    const check = () => {
      api('/api/auth/me')
        .then((result) => { if (!cancelled) setAdminAuthed(Boolean(result?.authenticated)) })
        .catch(() => { if (!cancelled) setAdminAuthed(false) })
    }

    check()
    window.addEventListener('auth-changed', check)
    return () => {
      cancelled = true
      window.removeEventListener('auth-changed', check)
    }
  }, [])

  const isAdmin = path === '/admin'
  const adminLabel = adminAuthed ? 'Администрирование' : 'Вход'

  return (
    <header className="sticky top-0 z-50 border-b border-stone-line bg-stone/85 backdrop-blur-md">
      <div className="shell flex h-16 items-center gap-4">
        {/* Логотип */}
        <a
          href="#/"
          className="flex min-w-0 items-center gap-2 text-graphite"
          aria-label={content.project.title}
        >
          <span className="text-lg text-accent" aria-hidden="true">
            {content.project.mark}
          </span>

          <span className="display-title truncate text-lg">
            {content.project.title}
          </span>
        </a>

        {/* Навигация для компьютера */}
        <nav
          aria-label={content.ui.menu}
          className="ml-auto hidden items-center gap-1.5 md:flex"
        >
          {content.nav.map((item) => {
            const active = path === item.href.replace(/^#/, '')

            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={navLinkClass(active)}
              >
                {item.label}
              </a>
            )
          })}

          {/* Админ-панель: «Вход» до авторизации, «Администрирование» после */}
          <a
            href="#/admin"
            aria-current={isAdmin ? 'page' : undefined}
            className={cn(
              navLinkClass(isAdmin),
              'ml-1',
            )}
          >
            {adminLabel}
          </a>

          <ThemeToggle className="ml-2" />
        </nav>

        {/* Навигация для телефона */}
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <ThemeToggle />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="pill gap-1.5 rounded-full border-stone-line bg-stone/70 px-3 text-graphite"
                aria-label={content.ui.openMenu}
              >
                <Menu className="size-4" aria-hidden="true" />
                {content.ui.menu}
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-72 border-l border-stone-line bg-stone"
            >
              <SheetHeader>
                <SheetTitle className="display-title text-lg">
                  {content.ui.menu}
                </SheetTitle>
              </SheetHeader>

              <Separator className="bg-stone-line" />

              <nav
                aria-label={content.ui.menu}
                className="flex flex-col gap-1 px-4"
              >
                {content.nav.map((item) => {
                  const active = path === item.href.replace(/^#/, '')

                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center rounded-r-full border-l-4 py-2.5 pl-4 text-base font-semibold transition-colors',
                        active
                          ? 'border-accent bg-stone-deep text-graphite'
                          : 'border-transparent text-graphite-soft hover:bg-stone-deep hover:text-graphite',
                      )}
                    >
                      {item.label}
                    </a>
                  )
                })}

                {/* Админ-панель в мобильном меню */}
                <a
                  href="#/admin"
                  aria-current={isAdmin ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center rounded-r-full border-l-4 py-2.5 pl-4 text-base font-semibold transition-colors',
                    isAdmin
                      ? 'border-accent bg-stone-deep text-graphite'
                      : 'border-transparent text-graphite-soft hover:bg-stone-deep hover:text-graphite',
                  )}
                >
                  {adminLabel}
                </a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}