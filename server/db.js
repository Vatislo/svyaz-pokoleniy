import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath) && fs.existsSync(path.join(__dirname, '.env.example'))) {
  fs.copyFileSync(path.join(__dirname, '.env.example'), envPath);
  console.log('Создан server/.env из server/.env.example — при необходимости поправьте значения.');
}

dotenv.config({ path: envPath });

export const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, 'data', 'app.db');

export const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, 'uploads');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

function run(sql, params = []) {
  const text = sql.trim();
  const verb = text.split(/\s+/, 1)[0].toUpperCase();

  if (verb === 'SELECT' || verb === 'PRAGMA') {
    return [db.prepare(text).all(...params)];
  }

  const info = db.prepare(text).run(...params);
  return [{ insertId: Number(info.lastInsertRowid), affectedRows: info.changes }];
}

// Тонкий адаптер поверх better-sqlite3 с интерфейсом mysql2/promise,
// чтобы index.js/init.js не пришлось переписывать под синхронный API.
const pool = {
  execute: async (sql, params = []) => run(sql, params),
  query: async (sql, params = []) => {
    if (params.length) throw new Error('pool.query поддерживается только без параметров');
    db.exec(sql);
    return [[], []];
  },
  end: async () => {
    db.close();
  },
};

export { db };
export default pool;
