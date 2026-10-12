#!/usr/bin/env node
/**
 * Валидация src/data/content.json
 * Логика — в src/lib/validateContent.js (покрыта тестами Vitest).
 * Запуск: npm run validate
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContent } from '../src/lib/validateContent.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'src', 'data', 'content.json');

let raw;
try {
  raw = readFileSync(file, 'utf8');
} catch (e) {
  console.error(`✖ Не удалось прочитать ${file}: ${e.message}`);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error(`✖ Не удалось разобрать JSON: ${e.message}`);
  process.exit(1);
}

const fileExists = (src) => {
  try {
    readFileSync(join(root, 'public', src.replace(/^\//, '')));
    return true;
  } catch {
    return false;
  }
};

const { errors, warnings, stats } = validateContent(data, { fileExists });

if (warnings.length) {
  console.log('Предупреждения:');
  for (const w of warnings) console.log(`  ⚠ ${w}`);
  console.log('');
}

if (errors.length) {
  console.error(`Ошибки (${errors.length}):`);
  for (const e of errors) console.error(`  ✖ ${e}`);
  process.exit(1);
}

console.log(
  `✔ content.json корректен: ${stats.sections.length} разделов, ` +
    `${stats.materials.length} материалов, ${stats.scenes.length} сцен, ` +
    `${stats.imageRefs.length} изображений`,
);
