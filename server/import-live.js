// Перенос данных с уже развернутого живого сайта в текущую базу:
//   node server/import-live.js https://svyaz-pokoleniy.onrender.com admin Пароль
// (логин/пароль можно не указывать — возьмутся из LIVE_USERNAME / LIVE_PASSWORD).
//
// Что делает: логинится в API живого сайта, забирает все проекты из админки,
// скачивает файлы из /uploads и складывает их в таблицу files текущей базы
// (SQLite-файл локально или Turso по TURSO_URL), после чего записи
// upsert'ятся в базу проектов.
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool, { useCloudDb } from './db.js';
import { initAll } from './init.js';
import { saveBuffer } from './storage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const PROJECT_COLUMNS = [
  'id', 'title', 'description', 'author', 'email', 'image_url', 'status',
  'created_at', 'updated_at', 'topic', 'project_type', 'media_url',
  'before_image_url', 'after_image_url', 'author_role', 'project_date',
  'source_info', 'tags_json', 'gallery_json',
];

let migratedFiles = 0;

const liveUrl = (process.argv[2] || process.env.LIVE_URL || '').replace(/\/$/, '');
const username = process.argv[3] || process.env.LIVE_USERNAME || 'admin';
const password = process.argv[4] || process.env.LIVE_PASSWORD;

// Ссылка вида /uploads/... или абсолютная на живом сайте → скачиваем файл,
// кладём в таблицу files и возвращаем новый адрес /uploads/<имя>.
async function migrateFile(url) {
  if (!url || typeof url !== 'string') return url;
  const isRelative = url.startsWith('/uploads/');
  const isLiveHost = /^https?:\/\//.test(url) && url.startsWith(liveUrl);
  if (!isRelative && !isLiveHost) return url;

  const sourceUrl = isRelative ? `${liveUrl}${url}` : url;
  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const name = path.basename(new URL(sourceUrl).pathname);
    const saved = await saveBuffer(buffer, { name, mime: response.headers.get('content-type') || 'application/octet-stream' });
    migratedFiles += 1;
    return `/uploads/${saved}`;
  } catch (error) {
    console.warn(`  файл не перенесён (${sourceUrl}): ${error.message} — ссылка оставлена как есть`);
    return url;
  }
}

async function main() {
  if (!liveUrl) {
    throw new Error('Укажите адрес живого сайта: node server/import-live.js https://... [логин] [пароль]');
  }
  if (!password) {
    throw new Error('Укажите пароль администратора живого сайта (3-й аргумент или LIVE_PASSWORD).');
  }

  await initAll();
  console.log(`Подключаюсь к ${liveUrl} как ${username}...`);

  const loginResponse = await fetch(`${liveUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!loginResponse.ok) {
    throw new Error(`Не удалось войти на живом сайте: HTTP ${loginResponse.status} ${await loginResponse.text()}`);
  }
  const cookie = (loginResponse.headers.get('set-cookie') || '').split(';')[0];
  if (!cookie) throw new Error('Живой сайт не вернул сессионную куку.');

  const listResponse = await fetch(`${liveUrl}/api/admin/projects`, {
    headers: { Cookie: cookie },
  });
  if (!listResponse.ok) throw new Error(`Не удалось получить список проектов: HTTP ${listResponse.status}`);
  const projects = await listResponse.json();
  console.log(`Проектов на живом сайте: ${projects.length}`);

  const insertSql = `
    INSERT INTO projects (${PROJECT_COLUMNS.join(', ')})
    VALUES (${PROJECT_COLUMNS.map(() => '?').join(', ')})
    ON CONFLICT(id) DO UPDATE SET ${PROJECT_COLUMNS.filter((c) => c !== 'id')
      .map((c) => `${c} = excluded.${c}`)
      .join(', ')}`;

  let imported = 0;
  for (const project of projects) {
    const image = await migrateFile(project.image_url);
    const media = await migrateFile(project.media_url);
    const before = await migrateFile(project.before_image_url);
    const after = await migrateFile(project.after_image_url);
    const gallery = [];
    for (const item of Array.isArray(project.gallery) ? project.gallery : []) {
      gallery.push(await migrateFile(item));
    }

    const values = PROJECT_COLUMNS.map((column) => project[column] ?? null);
    values[PROJECT_COLUMNS.indexOf('image_url')] = image;
    values[PROJECT_COLUMNS.indexOf('media_url')] = media;
    values[PROJECT_COLUMNS.indexOf('before_image_url')] = before;
    values[PROJECT_COLUMNS.indexOf('after_image_url')] = after;
    values[PROJECT_COLUMNS.indexOf('tags_json')] = JSON.stringify(Array.isArray(project.tags) ? project.tags : []);
    values[PROJECT_COLUMNS.indexOf('gallery_json')] = JSON.stringify(gallery);
    await pool.execute(insertSql, values);
    imported += 1;
  }

  const [count] = await pool.execute('SELECT COUNT(*) AS total FROM projects');
  const [filesCount] = await pool.execute('SELECT COUNT(*) AS total FROM files');
  console.log(`Готово: импортировано ${imported} проектов (файлов перенесено: ${migratedFiles}).`);
  console.log(`В базе сейчас: проектов ${count[0].total}, файлов ${filesCount[0].total} (${useCloudDb ? 'Turso' : 'локальный файл'}).`);

  await pool.end();
}

main().catch((error) => {
  console.error('Ошибка переноса:', error.message);
  process.exitCode = 1;
});
