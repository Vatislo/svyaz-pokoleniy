// Разовая миграция данных из старой MySQL/MariaDB-базы в SQLite.
// Запуск: node server/migrate-from-mysql.js
// Перед запуском задайте DB_* (MySQL) и DB_PATH (SQLite) в server/.env.
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import pool from './db.js';
import { initAll } from './init.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const PROJECT_COLUMNS = [
  'id', 'title', 'description', 'author', 'email', 'image_url', 'status',
  'created_at', 'updated_at', 'topic', 'project_type', 'media_url',
  'before_image_url', 'after_image_url', 'author_role', 'project_date',
  'source_info', 'tags_json', 'gallery_json',
];

function toIso(value) {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const text = String(value).trim();
  if (!text) return null;
  const parsed = new Date(text.includes('T') ? text : text.replace(' ', 'T') + 'Z');
  return Number.isNaN(parsed.getTime()) ? text : parsed.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

async function main() {
  await initAll();

  const source = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'svyaz',
    password: process.env.DB_PASSWORD || 'svyaz_local',
    database: process.env.DB_NAME || 'svyaz_pokoleniy',
  });

  const [projects] = await source.query(
    `SELECT ${PROJECT_COLUMNS.join(', ')} FROM projects ORDER BY id`,
  );
  const [admins] = await source.query('SELECT id, username, password_hash FROM admins ORDER BY id');

  const projectSql = `
    INSERT INTO projects (${PROJECT_COLUMNS.join(', ')})
    VALUES (${PROJECT_COLUMNS.map(() => '?').join(', ')})
    ON CONFLICT(id) DO UPDATE SET ${PROJECT_COLUMNS.filter((c) => c !== 'id')
      .map((c) => `${c} = excluded.${c}`)
      .join(', ')}`;

  let copiedProjects = 0;
  for (const row of projects) {
    const values = PROJECT_COLUMNS.map((column) => {
      const value = row[column];
      if (column === 'created_at' || column === 'updated_at') return toIso(value);
      return value === undefined ? null : value;
    });
    await pool.execute(projectSql, values);
    copiedProjects += 1;
  }

  let copiedAdmins = 0;
  for (const admin of admins) {
    await pool.execute(
      `INSERT INTO admins (id, username, password_hash) VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET username = excluded.username, password_hash = excluded.password_hash`,
      [admin.id, admin.username, admin.password_hash],
    );
    copiedAdmins += 1;
  }

  // Файлы загрузок уже лежат рядом с сервером — копировать их в SQLite-вариант не нужно,
  // но проверим, что каталог с картинками существует.
  const uploads = path.join(__dirname, 'uploads');
  const uploadsCount = fs.existsSync(uploads) ? fs.readdirSync(uploads).length : 0;

  console.log(`Миграция завершена: проектов — ${copiedProjects}, админов — ${copiedAdmins}, файлов в uploads — ${uploadsCount}.`);

  await source.end();
  await pool.end();
}

main().catch((error) => {
  console.error('Ошибка миграции:', error.message);
  process.exitCode = 1;
});
