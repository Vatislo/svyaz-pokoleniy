import { useState } from 'react'
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

// Активный пункт — залитая пилюля, неактивный — тихая подпись с подсветкой
// при наведении.
function navLinkClass(active) {
  return cn(
    'inline-flex h-9 items-center rounded-full border px-4 text-sm font-semibold transition-colors',
    active
      ? 'border-transparent bg-graphite text-stone'
      : 'border-transparent text-graphite-soft hover:border-stone-line hover:bg-stone-deep hover:text-graphite',
  )
}

export function Header({ path }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-stone-line bg-stone/85 backdrop-blur-md">
      <div className="shell flex h-16 items-center gap-3">
        {/* Логотип */}
        <a
          href="#/"
          className="group flex min-w-0 items-center gap-2 text-graphite"
          aria-label={content.project.title}
        >
          <span
            className="text-lg text-accent transition-transform duration-300 group-hover:rotate-90"
            aria-hidden="true"
          >
            {content.project.mark}
          </span>

          <span className="display-title truncate text-lg">
            <span className="hidden sm:inline">{content.project.title}</span>
            <span className="sm:hidden">{content.project.shortTitle}</span>
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

          <Separator
            orientation="vertical"
            className="mx-2 h-5 bg-stone-line"
            aria-hidden="true"
          />

          <ThemeToggle />
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
                className="flex flex-col items-start gap-2 px-4"
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
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
