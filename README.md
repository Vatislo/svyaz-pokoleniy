# Связь поколений — школьный конкурс «Мы помним связь поколений»

Портал конкурса: React (Vite) + Express + SQLite. Сайт, админка, API и загрузки
работают с одного адреса — локально и на хостинге.

## Требования

- Node.js 22+

Локально база — обычный SQLite-файл `server/data/app.db`, ничего дополнительно
устанавливать не нужно. На хостинге базу и файлы можно вынести в облако
(Turso и Cloudinary), чтобы они не терялись при рестартах — см. раздел
«Постоянное хранение данных».

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
npm install          # mysql2 ставится в devDependencies
npm run migrate:mysql
```

Скрипт скопирует проекты и администратора в `server/data/app.db`.
Файлы из `server/uploads/` остаются на месте — их переносить не нужно.

## Постоянное хранение данных (Turso + Cloudinary)

Бесплатный план Render не умеет постоянный диск: при каждом рестарте/деплое
файловая система стирается. Чтобы данные жили вечно, они выносятся наружу:

1. **База — Turso** (https://app.turso.tech, бесплатно):
   зарегистрируйтесь → **Create database** → вкладка **Connect** →
   скопируйте `URL` (`libsql://...`) и `Auth token`.
2. **Файлы — Cloudinary** (https://cloudinary.com, бесплатно):
   регистрация → Dashboard → скопируйте строку `CLOUDINARY_URL`
   (вида `cloudinary://key:secret@cloud`).
3. На Render в настройках сервиса добавьте переменные:
   `TURSO_URL`, `TURSO_AUTH_TOKEN`, `CLOUDINARY_URL` — и нажмите Deploy.
   (При создании Blueprint эти три переменные Render предложит заполнить сам.)

Без этих переменных всё работает как раньше — на диске сервиса.

Если данные уже есть на живом сайте, перенесите их одной командой
(проекты из админки + скачивание картинок, при настроенном Cloudinary —
сразу в облако):

```bash
# в server/.env предварительно пропишите TURSO_* и CLOUDINARY_*
npm run import:live -- https://svyaz-pokoleniy.onrender.com admin ВАШ_ПАРОЛЬ
```

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

- Файловая система эфемерная: при перезапуске/деплое всё, что локально на
  диске (SQLite-файл, загрузки), стирается и сайт возвращается к seed-данным.
- Решение — вынести данные наружу: `TURSO_URL`/`TURSO_AUTH_TOKEN` (база) и
  `CLOUDINARY_URL` (файлы), см. раздел «Постоянное хранение данных».
- Второй вариант — платный план + Persistent Disk: раскомментируйте блок
  `disk` в `render.yaml` и переменные `DB_PATH`, `UPLOADS_DIR`.

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
| `TURSO_URL`, `TURSO_AUTH_TOKEN` | Облачная база Turso (пусто = локальный файл) |
| `DB_PATH` | Путь к локальному файлу SQLite (по умолчанию `server/data/app.db`) |
| `CLOUDINARY_URL` (+`CLOUDINARY_FOLDER`) | Файлы в облаке (пусто = диск сервера) |
| `UPLOADS_DIR` | Локальный каталог загрузок (по умолчанию `server/uploads`) |
| `SESSION_SECRET` | Секрет сессий (смените при публикации) |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Учётные данные администратора |

## Структура

- `src/` — фронтенд (React + Vite)
- `server/index.js` — API Express (в продакшене раздаёт и `dist/`)
- `server/db.js` — доступ к базе: libSQL (Turso по `TURSO_URL`, иначе локальный файл)
- `server/init.js` — авто-инициализация (таблицы, seed, админ)
- `server/seed.sql` — начальные данные проектов
- `server/migrate-from-mysql.js` — разовая миграция из MySQL
- `server/import-live.js` — перенос данных с живого сайта (проекты + файлы)
- `render.yaml` — конфигурация деплоя на Render
- `server/uploads/` — локальные загрузки (не в git)

## Заметки

- `node_modules`, `dist`, `server/data/`, `server/uploads/`, `server/.env`
  и `*.sql` (кроме seed) в git не входят.
- Проекты из seed-данных отображаются без изображений, пока файлы не загрузят
  через админку.
