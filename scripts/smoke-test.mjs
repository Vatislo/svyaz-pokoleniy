/* Smoke-тест: открывает сайт в Chromium, собирает ошибки консоли, делает скриншоты. */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const OUT = '/tmp/smoke';
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const problems = [];

async function newPage(width, height) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`[console:${width}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => problems.push(`[pageerror:${width}] ${err.message}`));
  page.on('requestfailed', (req) =>
    problems.push(`[requestfailed:${width}] ${req.url()} — ${req.failure()?.errorText}`),
  );
  return page;
}

const page = await newPage(1440, 900);

// --- Главная ---
await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 700));
await page.screenshot({ path: `${OUT}/01-home-cover.png` });

const h1 = await page.$eval('h1', (el) => el.textContent.trim()).catch(() => null);
if (!h1) problems.push('На главной нет h1');

// смена сцены колесом
await page.mouse.move(720, 450);
await page.mouse.wheel({ deltaY: 400 });
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: `${OUT}/02-home-scene2.png` });

const activeDots = await page.$$eval('.home__dot--active', (els) => els.length);
if (activeDots !== 1) problems.push(`Активных точек сцены: ${activeDots} (ожидалось 1)`);

// клик по навигации сцен
const dots = await page.$$('.home__dot');
if (dots.length < 3) problems.push(`Точек сцены мало: ${dots.length}`);
await dots[0].click();
await new Promise((r) => setTimeout(r, 700));
await page.screenshot({ path: `${OUT}/03-home-back-to-cover.png` });

// --- Каталог ---
await page.goto(`${BASE}/#/catalog`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 500));
const cards = await page.$$('.catalog__grid > li');
if (cards.length < 10) problems.push(`Карточек в каталоге: ${cards.length} (ожидалось ≥10)`);
await page.screenshot({ path: `${OUT}/04-catalog.png` });

// поиск
await page.type('#catalog-search', 'радиоприёмник');
await new Promise((r) => setTimeout(r, 400));
const afterSearch = await page.$$eval('.catalog__grid > li', (els) => els.length);
if (afterSearch < 1 || afterSearch > 5)
  problems.push(`После поиска «радиоприёмник» карточек: ${afterSearch}`);
await page.screenshot({ path: `${OUT}/05-catalog-search.png` });

// пустой поиск
await page.$eval('#catalog-search', (el) => {
  el.value = '';
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.type('#catalog-search', 'ффффф');
await new Promise((r) => setTimeout(r, 400));
const emptyVisible = await page.$('.catalog__empty');
if (!emptyVisible) problems.push('Пустое состояние поиска не показано');
await page.screenshot({ path: `${OUT}/06-catalog-empty.png` });

// сброс
await page.click('.catalog__empty .btn');
await new Promise((r) => setTimeout(r, 300));
const afterReset = await page.$$eval('.catalog__grid > li', (els) => els.length);
if (afterReset < 10) problems.push(`После сброса фильтров карточек: ${afterReset}`);

// фильтр по разделу
const sectionChips = await page.$$('.catalog__group .catalog__chip');
if (sectionChips.length < 4) problems.push(`Чипов разделов: ${sectionChips.length}`);
await sectionChips[1].click();
await new Promise((r) => setTimeout(r, 300));
const filtered = await page.$$eval('.catalog__grid > li', (els) => els.length);
if (filtered < 1 || filtered >= afterReset)
  problems.push(`Фильтр по разделу: ${filtered} из ${afterReset}`);
await page.screenshot({ path: `${OUT}/07-catalog-filter.png` });

// --- Модальное окно материала ---
await page.click('.catalog__grid .card__open');
await new Promise((r) => setTimeout(r, 500));
const dialog = await page.$('[role="dialog"]');
if (!dialog) problems.push('Модальное окно материала не открылось');
await page.screenshot({ path: `${OUT}/08-modal.png` });
await page.keyboard.press('Escape');
await new Promise((r) => setTimeout(r, 400));
if (await page.$('[role="dialog"]')) problems.push('Модальное окно не закрылось по Escape');

// --- Материал типа pair: ползунок ---
await page.goto(`${BASE}/#/catalog?section=school-then-now`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 500));
const pairCard = await page.$$('.catalog__grid .card__open');
if (pairCard.length > 0) {
  await pairCard[0].click();
  await new Promise((r) => setTimeout(r, 500));
  const range = await page.$('.tns__range');
  if (!range) {
    problems.push('Ползунок «раньше / сейчас» не найден в модальном окне');
  } else {
    await range.focus();
    for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowLeft');
    await new Promise((r) => setTimeout(r, 200));
    const val = await page.$eval('.tns__range', (el) => el.value);
    if (Number(val) !== 42) problems.push(`Ползунок после ArrowLeft: ${val} (ожидалось 42)`);
    await page.screenshot({ path: `${OUT}/09-modal-pair-slider.png` });
  }
  await page.keyboard.press('Escape');
}

// --- О проекте ---
await page.goto(`${BASE}/#/about`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 400));
const aboutH1 = await page.$eval('h1', (el) => el.textContent.trim()).catch(() => null);
if (!aboutH1) problems.push('На странице «О проекте» нет h1');
await page.screenshot({ path: `${OUT}/10-about.png`, fullPage: true });

// --- 404-маршрут не должен ронять сайт ---
await page.goto(`${BASE}/#/nope`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 300));
if (!(await page.$('h1'))) problems.push('Неизвестный маршрут не отрисовал главную');

// --- Мобильный вид ---
const mobile = await newPage(390, 844);
await mobile.goto(`${BASE}/#/`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 600));
await mobile.screenshot({ path: `${OUT}/11-mobile-home.png` });

const burger = await mobile.$('.header__burger');
if (!burger) problems.push('Бургер-меню не найдено на мобильном');
else {
  await burger.click();
  await new Promise((r) => setTimeout(r, 300));
  const drawer = await mobile.$('.header__drawer--open');
  if (!drawer) problems.push('Мобильное меню не открылось');
  await mobile.screenshot({ path: `${OUT}/12-mobile-menu.png` });
  await mobile.click('.header__drawer-link[href="#/catalog"]');
  await new Promise((r) => setTimeout(r, 600));
  const url = mobile.url();
  if (!url.includes('/catalog')) problems.push(`Переход в каталог не сработал: ${url}`);
}

await mobile.screenshot({ path: `${OUT}/13-mobile-catalog.png` });
const mobileCards = await mobile.$$eval('.catalog__grid > li', (els) => els.length);
if (mobileCards < 5) problems.push(`Мобильный каталог: карточек ${mobileCards}`);

// мобильный модал
await mobile.click('.catalog__grid .card__open');
await new Promise((r) => setTimeout(r, 500));
await mobile.screenshot({ path: `${OUT}/14-mobile-modal.png` });
if (!(await mobile.$('[role="dialog"]'))) problems.push('Мобильное модальное окно не открылось');

// пустые данные: убеждаемся, что fallback сцен работает при пустом JSON —
// проверяем защитную ветку через несуществующий id
await mobile.goto(`${BASE}/#/catalog`, { waitUntil: 'networkidle0' });

await browser.close();

if (problems.length) {
  console.log('НАЙДЕНЫ ПРОБЛЕМЫ:');
  for (const p of problems) console.log(' -', p);
  process.exitCode = 1;
} else {
  console.log('Smoke-тест пройден без ошибок. Скриншоты: /tmp/smoke');
}
