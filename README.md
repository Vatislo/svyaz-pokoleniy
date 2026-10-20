# Связь поколений — школьный конкурс «Мы помним связь поколений»

Портал конкурса: React (Vite) + Express + SQLite. Сайт, админка, API и загрузки
работают с одного адреса — локально и на хостинге.

## Требования

- Node.js 22+

База данных — SQLite (файл `server/data/app.db`), ничего дополнительно
устанавливать не нужно.

## Локальный запуск

```bash
npm install
npm run setup     # создаёт server/.env, таблицы, начальные данные и админа
npm run dev:all   # API (http://localhost:3001) + сайт (http://localhost:5173)
```

Сайт открывается на http://localhost:5173 — Vite проксирует `/api` и
`/uploads` на API-сервер. Админка: http://localhost:5173/#/admin

Прод-режим локально (сайт и API с одного порта, как на хостинге):

```bash
npm run build && NODE_ENV=production npm start   # http://localhost:3001
```

## Перенос данных из старой MySQL-базы

Если есть старая MariaDB/MySQL с проектами:

```bash
npm install          # mysql2 теперь ставится в devDependencies
npm run migrate:mysql
```

Скрипт скопирует проекты и администратора в `server/data/app.db`.
Файлы из `server/uploads/` остаются на месте — их переносить не нужно.

## Деплой на Render (GitHub + хостинг)

Код лежит в GitHub (`Vatislo/svyaz-pokoleniy`), деплой настраивается один раз:

1. Откройте https://render.com → **New → Blueprint** → подключите репозиторий
   `Vatislo/svyaz-pokoleniy`. Render возьмёт настройки из `render.yaml`
   (сборка `npm install && npm run build`, запуск `npm start`).
2. После первого деплоя откройте адрес вида
   `https://svyaz-pokoleniy-xxxx.onrender.com` — сайт, каталог и загрузка
   проектов работают сразу.
3. Админка: `https://<ваш-адрес>/#/admin`. Логин — `admin`, пароль смотрите в
   переменной `ADMIN_PASSWORD` сервиса на Render (Render сгенерировал её
   автоматически при создании Blueprint).
4. Каждый push в ветку `main` автоматически пересобирает и публикует сайт.

### Ограничения бесплатного плана Render

- Файловая система эфемерная: при перезапуске/деплое SQLite-база и загруженные
  файлы теряются, сайт возвращается к начальным данным из `server/seed.sql`.
- Чтобы данные сохранялись, подключите Persistent Disk (платный план),
  раскомментируйте блок `disk` в `render.yaml` и переменные
  `DB_PATH=/var/data/app.db`, `UPLOADS_DIR=/var/data/uploads`.

## Администратор

- Логин: `admin` (задаётся `ADMIN_USERNAME`)
- Пароль: из `ADMIN_PASSWORD` (в `server/.env` локально, в переменных Render)
- Админка: `/#/admin` (локально — http://localhost:5173/#/admin)

Сбросить пароль: поменять `ADMIN_PASSWORD` (минимум 12 символов) и выполнить
`node server/create-admin.js`.

## Конфигурация

Все настройки — в `server/.env` (создаётся автоматически из
`server/.env.example`; на Render — переменные окружения сервиса):

| Переменная | Назначение |
| --- | --- |
| `API_PORT` / `PORT` | Порт сервера (по умолчанию 3001) |
| `DB_PATH` | Путь к файлу SQLite (по умолчанию `server/data/app.db`) |
| `UPLOADS_DIR` | Каталог загрузок (по умолчанию `server/uploads`) |
| `SESSION_SECRET` | Секрет сессий (смените при публикации) |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Учётные данные администратора |

## Структура

- `src/` — фронтенд (React + Vite)
- `server/index.js` — API Express (в продакшене раздаёт и `dist/`)
- `server/db.js` — SQLite (better-sqlite3)
- `server/init.js` — авто-инициализация (таблицы, seed, админ)
- `server/seed.sql` — начальные данные проектов
- `server/migrate-from-mysql.js` — разовая миграция из MySQL
- `render.yaml` — конфигурация деплоя на Render
- `server/uploads/` — загруженные файлы (не в git)

## Заметки

- `node_modules`, `dist`, `server/data/`, `server/uploads/`, `server/.env`
  и `*.sql` (кроме seed и setup-user) в git не входят.
- Проекты из seed-данных отображаются без изображений, пока файлы не загрузят
  через админку.
