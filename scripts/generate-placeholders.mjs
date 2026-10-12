#!/usr/bin/env node
/**
 * Генератор SVG-заглушек для проекта «Мы помним связь поколений».
 * Запуск: node scripts/generate-placeholders.mjs
 * Файлы записываются в public/images/.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'images');
mkdirSync(outDir, { recursive: true });

const TONES = {
  sepia: { a: '#c9a97a', b: '#8a6238', c: '#4d3620', ink: '#3a2b1a' },
  cool: { a: '#a8b4bd', b: '#6c7c88', c: '#3d4a54', ink: '#2c363e' },
  olive: { a: '#b3b189', b: '#77764f', c: '#454430', ink: '#33321f' },
  rust: { a: '#d09272', b: '#9d4f2d', c: '#5d2c18', ink: '#45200f' },
  dusk: { a: '#a49ab0', b: '#6d6179', c: '#3d3546', ink: '#2e2836' },
};

function svg({ w = 1200, h = 800, tone = 'sepia', label = '', tag = 'ДЕМО · ЗАГЛУШКА', seed = 1 }) {
  const t = TONES[tone] ?? TONES.sepia;
  const rnd = mulberry(seed);
  const blobs = Array.from({ length: 4 }, (_, i) => {
    const cx = Math.round(rnd() * w);
    const cy = Math.round(rnd() * h);
    const r = Math.round(Math.min(w, h) * (0.28 + rnd() * 0.42));
    const op = (0.1 + rnd() * 0.16).toFixed(2);
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${i % 2 ? t.a : t.b}" opacity="${op}"/>`;
  }).join('');
  const lines = Array.from({ length: 9 }, () => {
    const y = Math.round(rnd() * h);
    const op = (0.05 + rnd() * 0.09).toFixed(2);
    return `<rect x="0" y="${y}" width="${w}" height="${2 + Math.round(rnd() * 3)}" fill="${t.c}" opacity="${op}"/>`;
  }).join('');

  const tagSize = Math.max(14, Math.round(w / 82));
  const fs = Math.max(13, Math.round(w / 92));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label || 'Изображение-заглушка')}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.b}"/>
      <stop offset="0.55" stop-color="${t.c}"/>
      <stop offset="1" stop-color="${t.ink}"/>
    </linearGradient>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${seed}" result="n"/>
      <feColorMatrix in="n" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.14"/></feComponentTransfer>
      <feComposite operator="over" in2="SourceGraphic"/>
    </filter>
    <radialGradient id="vig" cx="0.5" cy="0.45" r="0.85">
      <stop offset="0.6" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.45"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  ${blobs}
  ${lines}
  <rect width="${w}" height="${h}" fill="url(#vig)"/>
  <rect x="${Math.round(w * 0.03)}" y="${Math.round(h * 0.045)}" width="${w - Math.round(w * 0.06)}" height="${h - Math.round(h * 0.09)}" fill="none" stroke="${t.a}" stroke-opacity="0.55" stroke-width="2"/>
  <text x="${Math.round(w * 0.06)}" y="${Math.round(h * 0.14)}" fill="${t.a}" font-family="Georgia, serif" font-size="${tagSize}" letter-spacing="${Math.round(tagSize / 4)}">${esc(tag)}</text>
  <text x="${Math.round(w * 0.06)}" y="${h - Math.round(h * 0.07)}" fill="#f7f1e4" font-family="Georgia, serif" font-size="${fs}" font-style="italic" opacity="0.42">${esc(label)}</text>
  <rect width="${w}" height="${h}" filter="url(#grain)" fill="none"/>
</svg>`;
}

function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const items = [
  { file: 'cover.svg', w: 1800, h: 1100, tone: 'sepia', label: 'Школьный архив', seed: 11 },
  { file: 'section-school.svg', tone: 'cool', label: 'Школа: тогда и сейчас', seed: 21 },
  { file: 'section-family.svg', tone: 'sepia', label: 'Семейные истории', seed: 22 },
  { file: 'section-people.svg', tone: 'olive', label: 'Люди и профессии', seed: 23 },
  { file: 'section-places.svg', tone: 'dusk', label: 'Памятные места', seed: 24 },
  { file: 'section-things.svg', tone: 'rust', label: 'Предметы и традиции', seed: 25 },
  { file: 'section-creative.svg', tone: 'olive', label: 'Творческие работы', seed: 26 },
  { file: 'school-yard-before.svg', tone: 'sepia', label: 'Школьный двор, раньше', seed: 31 },
  { file: 'school-yard-after.svg', tone: 'cool', label: 'Школьный двор, сейчас', seed: 32 },
  { file: 'classroom.svg', tone: 'cool', label: 'Классный уголок', seed: 33 },
  { file: 'street-before.svg', tone: 'sepia', label: 'Улица у школы, раньше', seed: 34 },
  { file: 'street-after.svg', tone: 'dusk', label: 'Улица у школы, сейчас', seed: 35 },
  { file: 'letter-home.svg', tone: 'sepia', label: 'Письмо из семейного архива', seed: 36 },
  { file: 'portrait-master.svg', tone: 'olive', label: 'Портрет мастера', seed: 37 },
  { file: 'photo-album.svg', tone: 'rust', label: 'Семейный альбом', seed: 38 },
  { file: 'recipe-note.svg', tone: 'rust', label: 'Рецепт из семейной тетради', seed: 39 },
  { file: 'embroidery.svg', tone: 'dusk', label: 'Вышитая салфетка', seed: 40 },
  { file: 'drawing-city.svg', tone: 'olive', label: 'Рисунок города', seed: 41 },
  { file: 'poem-page.svg', tone: 'sepia', label: 'Страница со стихотворением', seed: 42 },
  { file: 'memory-bench.svg', tone: 'cool', label: 'Место у библиотеки', seed: 43 },
  { file: 'radio-device.svg', tone: 'rust', label: 'Домашний радиоприёмник', seed: 44 },
];

for (const item of items) {
  writeFileSync(join(outDir, item.file), svg(item), 'utf8');
}
console.log(`Готово: создано ${items.length} заглушек в public/images/`);
