import fs from 'node:fs';
import path from 'node:path';
import pool, { uploadsDir } from './db.js';

export const MAX_FILE_SIZE = 16 * 1024 * 1024;

function generateName(originalname) {
  const ext = path.extname(originalname || '').toLowerCase().slice(0, 10);
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
}

export function sanitizeName(name) {
  const safe = path.basename(String(name || ''));
  return /^[\w.-]+$/.test(safe) ? safe : '';
}

export async function saveBuffer(buffer, { name, mime }) {
  const safeName = sanitizeName(name) || generateName(name);
  await pool.execute(
    'INSERT INTO files (name, mime, size, data) VALUES (?, ?, ?, ?) ON CONFLICT(name) DO UPDATE SET mime = excluded.mime, size = excluded.size, data = excluded.data',
    [safeName, mime || 'application/octet-stream', buffer.length, buffer],
  );
  return safeName;
}

export async function removeUpload(name) {
  const safeName = sanitizeName(name);
  if (!safeName) return;
  await pool.execute('DELETE FROM files WHERE name = ?', [safeName]);
  try {
    fs.unlinkSync(path.join(uploadsDir, safeName));
  } catch {}
}

export const dbStorage = {
  _handleFile(req, file, cb) {
    const chunks = [];
    let size = 0;
    file.stream.on('data', (chunk) => {
      chunks.push(chunk);
      size += chunk.length;
    });
    file.stream.on('error', (error) => cb(error));
    file.stream.on('end', async () => {
      try {
        const name = generateName(file.originalname);
        await saveBuffer(Buffer.concat(chunks), { name, mime: file.mimetype });
        cb(null, { path: `/uploads/${name}`, filename: name, size });
      } catch (error) {
        cb(error);
      }
    });
  },
  _removeFile(req, file, cb) {
    removeUpload(file.filename).then(() => cb(null), cb);
  },
};

export function fileUrl(file) {
  return `/uploads/${file.filename}`;
}

export async function discardFiles(files) {
  for (const file of files || []) {
    try {
      await removeUpload(file.filename);
    } catch {}
  }
}

export async function removeMediaUrl(value) {
  if (typeof value !== 'string' || !value.startsWith('/uploads/')) return;
  try {
    await removeUpload(path.basename(value));
  } catch (error) {
    console.warn('Не удалось удалить файл:', value, error.message);
  }
}
