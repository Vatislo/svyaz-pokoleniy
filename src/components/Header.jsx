import { useEffect, useId, useState } from 'react';

import { useTheme } from '../lib/useTheme.js';
import './Header.css';

const LINKS = [
  { href: '#/', key: 'home' },
  { href: '#/catalog', key: 'catalog' },
  { href: '#/about', key: 'about' },
];

export default function Header({ project, ui, route }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const { theme, toggle } = useTheme();
  const themeLabels = ui?.nav?.theme || {};
  const isDark = theme === 'dark';

  // Закрываем меню при смене маршрута. Синхронизация во время рендера
  // (паттерн React «adjusting state when props change») — без эффекта.
  const [prevRoute, setPrevRoute] = useState(route);
  if (route !== prevRoute) {
    setPrevRoute(route);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const isActive = (key) => {
    if (key === 'home') return route === '/';
    if (key === 'catalog') return route.startsWith('/catalog');
    if (key === 'about') return route.startsWith('/about');
    return false;
  };

  return (
    <header className="header">
      <div className="header__inner container">
        <a className="header__brand" href="#/" aria-label={`${project.title} — на главную`}>
          <span className="header__mark" aria-hidden="true">
            ✦
          </span>
          <span className="header__title">{project.title}</span>
        </a>

        <nav className="header__nav" aria-label="Основная навигация">
          <ul className="header__list">
            {LINKS.map((link) => (
              <li key={link.key}>
                <a
                  className={`header__link ${isActive(link.key) ? 'header__link--active' : ''}`}
                  href={link.href}
                  aria-current={isActive(link.key) ? 'page' : undefined}
                >
                  {ui.nav[link.key]}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="header__theme"
          onClick={toggle}
          aria-pressed={isDark}
          aria-label={
            isDark
              ? themeLabels.toLight || 'Включить светлую тему'
              : themeLabels.toDark || 'Включить тёмную тему'
          }
          title={
            isDark
              ? themeLabels.toLight || 'Включить светлую тему'
              : themeLabels.toDark || 'Включить тёмную тему'
          }
        >
          <span className="header__theme-icon" aria-hidden="true">
            {isDark ? '☾' : '☀'}
          </span>
        </button>

        <button
          type="button"
          className="header__burger"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="header__burger-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          {open ? ui.nav.menuClose : ui.nav.menuOpen}
        </button>
      </div>

      <div
        id={menuId}
        className={`header__drawer ${open ? 'header__drawer--open' : ''}`}
        hidden={!open}
      >
        <nav aria-label="Мобильная навигация">
          <ul className="header__drawer-list">
            {LINKS.map((link) => (
              <li key={link.key}>
                <a
                  className={`header__drawer-link ${isActive(link.key) ? 'header__drawer-link--active' : ''}`}
                  href={link.href}
                  aria-current={isActive(link.key) ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {ui.nav[link.key]}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="header__drawer-theme"
          onClick={toggle}
          aria-pressed={isDark}
        >
          <span aria-hidden="true">{isDark ? '☾' : '☀'}</span>
          {isDark
            ? themeLabels.toLight || 'Включить светлую тему'
            : themeLabels.toDark || 'Включить тёмную тему'}
        </button>
      </div>
    </header>
  );
}
