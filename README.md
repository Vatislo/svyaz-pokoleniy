# Связь поколений — школьный конкурс «Мы помним связь поколений»

Портал конкурса: React (Vite) + Express + SQLite. Сайт, API и загрузки
работают с одного адреса — локально и на хостинге.

Панель управления — **отдельный проект** в соседней папке
`svyaz-pokoleniy-admin` (свой `package.json` и Vite). Здесь, в основном
репозитории, её нет: ни маршрута `#/admin`, ни ссылки «Вход» — только
публичный сайт и API. На хостинге этот же репозиторий запускается **дважды**:
публичный сервис — без админских маршрутов и с read-only токеном базы,
админский — с полным токеном (см. «Два сервиса на Render»).

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
`/uploads` на API-сервер.

Панель управления запускается отдельно (порт 5174):

```bash
cd ../svyaz-pokoleniy-admin
npm install && npm run dev   # http://localhost:5174
```

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

Код лежит в GitHub (`Vatislo/svyaz-pokoleniy`), панель — в соседнем
репозитории (`svyaz-pokoleniy-admin`). На Render поднимаются **три сервиса**:

| Сервис | Репозиторий | Что делает | Токен Turso |
| --- | --- | --- | --- |
| `svyaz-pokoleniy` | этот | публичный сайт + API без админ-маршрутов | read-only |
| `svyaz-admin-api` | этот | `/api/auth/*`, `/api/admin/*`, инициализация базы | полный (write) |
| `svyaz-admin` | `svyaz-pokoleniy-admin` | панель + прокси на админский API | — |

Порядок настройки:

1. **Два токена Turso на одну базу.** Полный —
   `turso db tokens create <имя-базы>`, read-only —
   `turso db tokens create <имя-базы> --read-only` (или в дашборде Turso
   при создании токена выберите Read only).
2. **Один общий секрет** для трёх сервисов: придумайте длинную строку
   (`openssl rand -hex 32`) — это `GATEWAY_SECRET`. Пока он задан на
   админском API, тот не отвечает без заголовка `x-gateway-secret`
   (кроме `/api/health`) — адрес нельзя перебрать снаружи.
3. **Blueprint основного репозитория**: New → Blueprint → `svyaz-pokoleniy` —
   Render создаст оба сервиса. Заполните переменные с `sync: false`:
   - `svyaz-admin-api`: `TURSO_URL`, `TURSO_AUTH_TOKEN` (полный),
     `GATEWAY_SECRET`. `ADMIN_PASSWORD` Render сгенерирует сам.
   - `svyaz-pokoleniy`: `TURSO_URL`, `TURSO_AUTH_TOKEN` (read-only),
     `GATEWAY_SECRET` и
     `SUBMIT_FORWARD_URL=https://<адрес svyaz-admin-api>/api/projects`.
4. **Задеплойте сначала `svyaz-admin-api`** — он создаёт таблицы, сид и
   администратора; публичному сервису с read-only токеном делать это
   запрещено, поэтому он стартует со `SKIP_INIT=1` и должен приходить
   вторым.
5. **Blueprint панели**: репозиторий `svyaz-pokoleniy-admin` →
   `ADMIN_API_URL=https://<адрес svyaz-admin-api>`, `GATEWAY_SECRET`,
   `VITE_SITE_URL=https://<адрес svyaz-pokoleniy>`.
6. Логин — `admin`, пароль из `ADMIN_PASSWORD` сервиса `svyaz-admin-api`.
   Адрес панели — единственный, который надо держать в секрете: на
   публичном сайте его нет ни в коде, ни в ссылках, а заявки с формы
   уходят на админский API сервером-прокси, а не из браузера.
7. Каждый push в `main` пересобирает соответствующий сервис.

Почему панель ходит в API через свой сервер-прокси (`server.js`):
`*.onrender.com` входит в Public Suffix List, поэтому два поддоменда
Render браузер считает **разными сайтами** — межсайтовая кука
`SameSite=lax` между ними не отправлялась бы. Через прокси браузер видит
один домен, и сессия остаётся обычной first-party-кукой: ни CORS, ни
`sameSite=none` не нужны.

### Ограничения бесплатного плана Render

- Файловая система эфемерная: при перезапуске/деплое всё, что локально на
  диске (SQLite-файл, загрузки), стирается и сайт возвращается к seed-данным.
- Решение — вынести данные наружу: `TURSO_URL`/`TURSO_AUTH_TOKEN` (база) и
  `CLOUDINARY_URL` (файлы), см. раздел «Постоянное хранение данных».
- Три бесплатных web-сервиса делят лимит 750 часов в месяц и по очереди
  засыпают: после 15 минут простоя первый запрос будит сервис примерно
  за минуту. На время пробуждения админского API может «подвиснуть»
  отправка формы — обычно помогает повторить отправку.
- Второй вариант хранения — платный план + Persistent Disk: раскомментируйте
  блок `disk` в `render.yaml` и переменные `DB_PATH`, `UPLOADS_DIR`.

## Администратор

- Логин: `admin` (задаётся `ADMIN_USERNAME`)
- Пароль: из `ADMIN_PASSWORD` (в `server/.env` локально, в переменных Render)
- Панель управления: отдельный проект `svyaz-pokoleniy-admin`
  (локально — http://localhost:5174)

Сбросить пароль: поменять `ADMIN_PASSWORD` (минимум 12 символов) и выполнить
`node server/create-admin.js`.

Сами API-маршруты `/api/auth/*` и `/api/admin/*` остаются здесь, в этом
репозитории, но на публичном сервисе они не смонтированы вовсе (`ADMIN_ROUTES=off`
→ 404): живут только на сервисе `svyaz-admin-api`.

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
| `ADMIN_ROUTES=off` | Публичный инстанс: `/api/auth/*` и `/api/admin/*` не существуют |
| `SKIP_INIT=1` | Не создавать таблицы при старте (нужно read-only инстансу) |
| `SUBMIT_FORWARD_URL` | Адрес админского API: заявки с формы пересылаются туда |
| `GATEWAY_SECRET` | Общий секрет: админский API не отвечает без заголовка `x-gateway-secret` |

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
