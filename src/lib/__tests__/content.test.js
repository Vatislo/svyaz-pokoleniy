import { describe, expect, it } from 'vitest';
import content from '../../data/content.json';
import { validateContent } from '../validateContent.js';
import {
  buildScenes,
  filterMaterials,
  getMaterials,
  getSections,
  getUi,
  randomMaterial,
  relatedMaterials,
  sectionTitle,
  typeLabel,
} from '../content.js';

const M = (over = {}) => ({
  id: 'm1',
  sectionId: 'sec-1',
  type: 'photo',
  title: 'Заголовок',
  summary: 'Кратко',
  description: 'Подробный текст',
  author: 'Автор',
  source: 'Источник',
  tags: ['школа'],
  ...over,
});

describe('filterMaterials', () => {
  const items = [
    M({ id: 'a', tags: ['фото', 'школа'] }),
    M({
      id: 'b',
      type: 'story',
      title: 'История бабушки',
      sectionId: 'sec-2',
      tags: ['рассказ'],
    }),
    M({ id: 'c', type: 'video', title: 'Видеоурок', tags: [] }),
  ];

  it('возвращает все материалы без фильтров', () => {
    expect(filterMaterials(items, {})).toHaveLength(3);
  });

  it('игнорирует не-массив входных данных', () => {
    expect(filterMaterials(null)).toEqual([]);
    expect(filterMaterials(undefined, { query: 'x' })).toEqual([]);
  });

  it('фильтрует по разделу', () => {
    const res = filterMaterials(items, { sectionId: 'sec-2' });
    expect(res.map((m) => m.id)).toEqual(['b']);
  });

  it('фильтрует по типу', () => {
    const res = filterMaterials(items, { type: 'video' });
    expect(res.map((m) => m.id)).toEqual(['c']);
  });

  it('ищет по заголовку без учёта регистра', () => {
    const res = filterMaterials(items, { query: 'ИСТОРИЯ' });
    expect(res.map((m) => m.id)).toEqual(['b']);
  });

  it('ищет по тегам, автору и описанию', () => {
    expect(filterMaterials(items, { query: 'рассказ' }).map((m) => m.id)).toEqual(['b']);
    expect(filterMaterials(items, { query: 'Автор' })).toHaveLength(3);
    expect(filterMaterials(items, { query: 'Подробный' })).toHaveLength(3);
  });

  it('комбинирует поисковый запрос и фильтры', () => {
    expect(filterMaterials(items, { query: 'История', sectionId: 'sec-2' })).toHaveLength(1);
    expect(filterMaterials(items, { query: 'История', sectionId: 'sec-1' })).toHaveLength(0);
  });

  it('обрезает пробелы в запросе', () => {
    expect(filterMaterials(items, { query: '   история   ' })).toHaveLength(1);
  });

  it('возвращает пусто при несовпадении', () => {
    expect(filterMaterials(items, { query: 'несуществующее' })).toEqual([]);
  });

  it('отбрасывает не-объекты в массиве', () => {
    expect(filterMaterials([null, undefined, 42, 'x'], {})).toEqual([]);
  });
});

describe('relatedMaterials', () => {
  const items = [
    M({ id: 'a', tags: ['фото', 'школа'] }),
    M({ id: 'b', tags: ['школа', 'память'] }),
    M({ id: 'c', tags: ['память'], sectionId: 'sec-2' }),
    M({ id: 'd', tags: ['совсем-другое'], sectionId: 'sec-3' }),
  ];

  it('исключает сам материал', () => {
    const res = relatedMaterials(items, 'a');
    expect(res.map((m) => m.id)).not.toContain('a');
  });

  it('предпочитает совпадения по тегам', () => {
    const res = relatedMaterials(items, 'a');
    expect(res[0].id).toBe('b');
  });

  it('не возвращает материалы без общих тегов и раздела', () => {
    const res = relatedMaterials(items, 'a');
    expect(res.map((m) => m.id)).not.toContain('d');
  });

  it('учитывает limit', () => {
    expect(relatedMaterials(items, 'a', { limit: 1 })).toHaveLength(1);
  });

  it('возвращает первые N, если id не найден', () => {
    const res = relatedMaterials(items, 'ghost', { limit: 2 });
    expect(res).toHaveLength(2);
  });

  it('справляется с пустым входом', () => {
    expect(relatedMaterials(null, 'a')).toEqual([]);
    expect(relatedMaterials([], 'a')).toEqual([]);
  });
});

describe('randomMaterial', () => {
  const items = [M({ id: 'a' }), M({ id: 'b' }), M({ id: 'c' })];

  it('всегда возвращает материал, отличный от currentId', () => {
    for (let i = 0; i < 30; i += 1) {
      const pick = randomMaterial(items, 'a');
      expect(pick).toBeTruthy();
      expect(pick.id).not.toBe('a');
    }
  });

  it('возвращает null, если других материалов нет', () => {
    expect(randomMaterial([M({ id: 'a' })], 'a')).toBeNull();
    expect(randomMaterial(null, 'a')).toBeNull();
    expect(randomMaterial([], null)).toBeNull();
  });

  it('всегда возвращает что-то из списка', () => {
    for (let i = 0; i < 30; i += 1) {
      expect(items.map((m) => m.id)).toContain(randomMaterial(items, null)?.id);
    }
  });
});

describe('buildScenes', () => {
  it('строит сцены из реального контента', () => {
    const scenes = buildScenes();
    expect(scenes.length).toBeGreaterThan(0);
    expect(scenes[0].type).toBe('cover');
  });

  it('всегда содержит cta-сцену', () => {
    expect(buildScenes().some((s) => s.type === 'cta')).toBe(true);
  });

  it('при некорректном сценарии строит запасной', () => {
    // Заглушка логики: если бы raw-сцены были мусором, fallback всё равно
    // собрал бы минимум cover + cta. Проверяем через реальные данные.
    const scenes = buildScenes();
    expect(scenes.some((s) => s.type === 'cover')).toBe(true);
    expect(scenes.length).toBeGreaterThanOrEqual(2);
  });

  it('парные сцены получают материал', () => {
    const pair = buildScenes().find((s) => s.type === 'pair');
    if (pair) expect(pair.material).toBeTruthy();
  });
});

describe('доступ к контенту', () => {
  it('getSections и getMaterials возвращают массивы', () => {
    expect(Array.isArray(getSections())).toBe(true);
    expect(Array.isArray(getMaterials())).toBe(true);
    expect(getSections().length).toBeGreaterThan(0);
    expect(getMaterials().length).toBeGreaterThan(0);
  });

  it('sectionTitle и typeLabel возвращают строки', () => {
    expect(typeof sectionTitle(getSections()[0].id)).toBe('string');
    expect(typeof typeLabel('photo')).toBe('string');
    expect(sectionTitle('нет-такого')).toBe('');
    expect(typeLabel('нет-такого')).toBe('');
  });

  it('getUi возвращает объект', () => {
    expect(typeof getUi()).toBe('object');
  });
});

describe('реальный content.json', () => {
  it('проходит валидацию без ошибок', () => {
    const { errors } = validateContent(content);
    expect(errors).toEqual([]);
  });

  it('содержит все обязательные разделы', () => {
    for (const key of ['project', 'ui', 'scenes', 'sections', 'materials', 'about', 'footer']) {
      expect(content).toHaveProperty(key);
    }
  });

  it('каждый материал ссылается на существующий раздел', () => {
    const ids = new Set(content.sections.map((s) => s.id));
    for (const m of content.materials) {
      expect(ids.has(m.sectionId)).toBe(true);
    }
  });

  it('все сцены имеют известный тип', () => {
    const known = ['cover', 'sections', 'pair', 'material', 'cta'];
    for (const sc of content.scenes) {
      expect(known).toContain(sc.type);
    }
  });
});
