import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';
import pool from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CURRENT_TIME = `strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`;

async function ensureTables() {
  await pool.query(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    author TEXT NOT NULL,
    email TEXT NOT NULL,
    image_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (${CURRENT_TIME}),
    updated_at TEXT NOT NULL DEFAULT (${CURRENT_TIME}),
    topic TEXT,
    project_type TEXT NOT NULL DEFAULT 'photo',
    media_url TEXT,
    before_image_url TEXT,
    after_image_url TEXT,
    author_role TEXT,
    project_date TEXT,
    source_info TEXT,
    tags_json TEXT,
    gallery_json TEXT
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (${CURRENT_TIME})
  )`);

  // updated_at обновляется автоматически при любом UPDATE по projects.
  // Рекурсивные триггеры выключены по умолчанию — зацикливания не будет.
  await pool.query(`CREATE TRIGGER IF NOT EXISTS projects_touch
    AFTER UPDATE ON projects
    BEGIN
      UPDATE projects SET updated_at = ${CURRENT_TIME} WHERE id = NEW.id;
    END`);
}

async function seedIfEmpty() {
  const [rows] = await pool.execute('SELECT COUNT(*) AS total FROM projects');
  if (rows[0].total > 0) return false;

  const seedPath = path.join(__dirname, 'seed.sql');
  if (!fs.existsSync(seedPath)) return false;

  const sql = fs.readFileSync(seedPath, 'utf8').trim();
  if (!sql) return false;

  await pool.query(sql);
  return true;
}

async function ensureAdmin() {
  const [rows] = await pool.execute('SELECT COUNT(*) AS total FROM admins');
  if (rows[0].total > 0) return false;

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD;

  if (!password || password.length < 12) {
    console.warn(
      'Администратор не создан: задайте ADMIN_PASSWORD (минимум 12 символов) в server/.env и выполните npm run setup.',
    );
    return false;
  }

  const hash = await bcrypt.hash(password, 12);
  await pool.execute('INSERT INTO admins (username, password_hash) VALUES (?, ?)', [username, hash]);
  return true;
}

export async function initAll() {
  await ensureTables();
  const seeded = await seedIfEmpty();
  const adminCreated = await ensureAdmin();
  return { seeded, adminCreated };
}
