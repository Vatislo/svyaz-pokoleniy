import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath) && fs.existsSync(path.join(__dirname, '.env.example'))) {
  fs.copyFileSync(path.join(__dirname, '.env.example'), envPath);
  console.log('Создан server/.env из server/.env.example — при необходимости поправьте значения.');
}

dotenv.config({ path: envPath });

// Где хранится база:
//  - TURSO_URL задан (Render) — облачная SQLite (Turso/libSQL), данные переживают рестарты;
//  - иначе — локальный файл server/data/app.db (для разработки и миграций).
export const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, 'data', 'app.db');

export const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, 'uploads');

fs.mkdirSync(uploadsDir, { recursive: true });

const tursoUrl = process.env.TURSO_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;
export const useCloudDb = Boolean(tursoUrl);

let client;

if (useCloudDb) {
  client = createClient({ url: tursoUrl, authToken: tursoToken });
} else {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  client = createClient({ url: `file:${DB_PATH}` });
  // Режимы работают только для локального файла; к облачной базе не применяются.
  await client.execute('PRAGMA journal_mode = WAL');
  await client.execute('PRAGMA busy_timeout = 5000');
}

function toPlainRows(resultSet) {
  return resultSet.rows.map((row) => {
    const source = { ...row };
    const out = {};
    for (const [key, value] of Object.entries(source)) {
      out[key] = typeof value === 'bigint' ? Number(value) : value;
    }
    return out;
  });
}

// Адаптер с интерфейсом mysql2/promise: index.js/init.js/migration не знают о libSQL.
async function run(sql, params = []) {
  const text = sql.trim();
  const request = params.length ? { sql: text, args: params } : text;
  const result = await client.execute(request);
  const verb = text.split(/\s+/, 1)[0].toUpperCase();

  if (verb === 'SELECT' || verb === 'PRAGMA') {
    return [toPlainRows(result)];
  }

  return [{
    insertId: Number(result.lastInsertRowid ?? 0),
    affectedRows: result.rowsAffected,
  }];
}

const pool = {
  execute: async (sql, params = []) => run(sql, params),
  query: async (sql, params = []) => {
    if (params.length) throw new Error('pool.query поддерживается только без параметров');
    await client.executeMultiple(sql);
    return [[], []];
  },
  end: async () => {
    client.close();
  },
};

export { client };
export default pool;
