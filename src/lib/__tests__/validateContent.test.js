import { describe, expect, it } from 'vitest';
import { validateContent, MATERIAL_TYPES, SCENE_TYPES } from '../validateContent.js';

function makeValidData() {
  return {
    project: { name: 'Проект' },
    ui: {},
    scenes: [
      { id: 'cover', type: 'cover' },
      { id: 's1', type: 'sections', sectionIds: ['sec-1'] },
      { id: 'm1', type: 'material', materialId: 'mat-1' },
      { id: 'p1', type: 'pair', materialId: 'mat-pair' },
      { id: 'cta', type: 'cta' },
    ],
    sections: [
      { id: 'sec-1', title: 'Раздел' },
      { id: 'sec-2', title: 'Второй' },
    ],
    materials: [
      {
        id: 'mat-1',
        sectionId: 'sec-1',
        type: 'photo',
        title: 'Фото',
        image: '/images/a.svg',
      },
      {
        id: 'mat-pair',
        sectionId: 'sec-2',
        type: 'pair',
        title: 'Пара',
        before: { src: '/images/b.svg' },
        after: { src: '/images/c.svg' },
      },
      {
        id: 'mat-video',
        sectionId: 'sec-1',
        type: 'video',
        title: 'Видео',
        video: { src: '/video/1.mp4' },
      },
    ],
    about: {},
    footer: {},
  };
}

describe('validateContent — валидные данные', () => {
  it('не находит ошибок на корректном наборе', () => {
    const { errors } = validateContent(makeValidData());
    expect(errors).toEqual([]);
  });

  it('возвращает stats с массивами и списком ссылок на изображения', () => {
    const { stats } = validateContent(makeValidData());
    expect(stats.sections).toHaveLength(2);
    expect(stats.materials).toHaveLength(3);
    expect(stats.scenes).toHaveLength(5);
    expect(stats.imageRefs.length).toBeGreaterThan(0);
  });

  it('принимает обычные строки в текстовых полях', () => {
    const data = makeValidData();
    data.sections[0].title = 'Просто строка';
    const { errors } = validateContent(data);
    expect(errors).toEqual([]);
  });

  it('проверяет существование файлов изображений через fileExists', () => {
    const seen = [];
    validateContent(makeValidData(), {
      fileExists: (src) => {
        seen.push(src);
        return true;
      },
    });
    expect(seen).toContain('/images/a.svg');
    expect(seen).toContain('/images/b.svg');
  });

  it('сообщает об отсутствующем файле изображения', () => {
    const { errors } = validateContent(makeValidData(), { fileExists: () => false });
    expect(errors.some((e) => e.includes('не найден в public/'))).toBe(true);
  });

  it('не проверяет внешние http/https/data ссылки', () => {
    const data = makeValidData();
    data.materials[0].image = 'https://example.com/a.png';
    const seen = [];
    validateContent(data, {
      fileExists: (src) => {
        seen.push(src);
        return true;
      },
    });
    expect(seen).not.toContain('https://example.com/a.png');
  });
});

describe('validateContent — ошибки', () => {
  it('отвергает не-объект в корне', () => {
    const { errors } = validateContent(null);
    expect(errors[0]).toMatch(/объект/i);
  });

  it('требует все обязательные верхнеуровневые разделы', () => {
    const { errors } = validateContent({ project: {}, ui: {} });
    expect(errors.some((e) => e.includes('sections'))).toBe(true);
    expect(errors.some((e) => e.includes('materials'))).toBe(true);
    expect(errors.some((e) => e.includes('scenes'))).toBe(true);
  });

  it('ловит пустые массивы sections и materials', () => {
    const data = makeValidData();
    data.sections = [];
    data.materials = [];
    const { errors } = validateContent(data);
    expect(errors.some((e) => e.includes('sections пуст'))).toBe(true);
    expect(errors.some((e) => e.includes('materials пуст'))).toBe(true);
  });

  it('ловит дублирующиеся id секций', () => {
    const data = makeValidData();
    data.sections[1].id = 'sec-1';
    const { errors } = validateContent(data);
    expect(errors.some((e) => e.includes('дублируется id'))).toBe(true);
  });

  it('ловит дублирующиеся id материалов', () => {
    const data = makeValidData();
    data.materials[1].id = 'mat-1';
    const { errors } = validateContent(data);
    expect(errors.some((e) => e.includes('дублируется id'))).toBe(true);
  });

  it('ловит sectionId, отсутствующий в sections', () => {
    const data = makeValidData();
    data.materials[0].sectionId = 'nope';
    const { errors } = validateContent(data);
    expect(errors.some((e) => e.includes('не найден в sections'))).toBe(true);
  });

  it('ловит неизвестный type материала', () => {
    const data = makeValidData();
    data.materials[0].type = 'mystery';
    const { errors } = validateContent(data);
    expect(errors.some((e) => e.includes('неизвестный type'))).toBe(true);
  });

  it('требует before.src и after.src для type=pair', () => {
    const data = makeValidData();
    delete data.materials[1].after;
    const { errors } = validateContent(data);
    expect(errors.some((e) => e.includes('after.src'))).toBe(true);
    expect(errors.some((e) => e.includes('before.src'))).toBe(false);

    delete data.materials[1].before;
    const second = validateContent(data);
    expect(second.errors.some((e) => e.includes('before.src'))).toBe(true);
  });

  it('требует video.src для type=video', () => {
    const data = makeValidData();
    data.materials[2].video = 'не объект';
    const { errors } = validateContent(data);
    expect(errors.some((e) => e.includes('video должен быть объектом'))).toBe(true);
  });

  it('ловит неизвестный type сцены', () => {
    const data = makeValidData();
    data.scenes[0].type = 'abstract';
    const { errors } = validateContent(data);
    expect(errors.some((e) => e.includes('неизвестный type сцены'))).toBe(true);
  });

  it('проверяет materialId сцен по materials', () => {
    const data = makeValidData();
    data.scenes[2].materialId = 'ghost';
    const { errors } = validateContent(data);
    expect(errors.some((e) => e.includes('не найден в materials'))).toBe(true);
  });

  it('требует, чтобы сцена pair ссылалась на материал типа pair', () => {
    const data = makeValidData();
    data.scenes[3].materialId = 'mat-1';
    const { errors } = validateContent(data);
    expect(errors.some((e) => e.includes('не имеет type=pair'))).toBe(true);
  });

  it('проверяет sectionIds сцены sections', () => {
    const data = makeValidData();
    data.scenes[1].sectionIds = ['ghost-section'];
    const { errors } = validateContent(data);
    expect(errors.some((e) => e.includes('не найден в sections'))).toBe(true);
  });

  it('сообщает об ошибке, если текстовое поле не строка', () => {
    const data = makeValidData();
    data.sections[0].title = 123;
    const { errors } = validateContent(data);
    expect(errors.some((e) => e.includes('ожидалась строка'))).toBe(true);
  });

  it('предупреждает о пустой строке', () => {
    const data = makeValidData();
    data.sections[0].title = '   ';
    const { warnings } = validateContent(data);
    expect(warnings.some((w) => w.includes('строка пуста'))).toBe(true);
  });

  it('предупреждает про photo без image, но не считает это ошибкой', () => {
    const data = makeValidData();
    delete data.materials[0].image;
    const { errors, warnings } = validateContent(data);
    expect(errors).toEqual([]);
    expect(warnings.some((w) => w.includes('отсутствует image'))).toBe(true);
  });

  it('предупреждает про пустой массив scenes', () => {
    const data = makeValidData();
    data.scenes = [];
    const { warnings } = validateContent(data);
    expect(warnings.some((w) => w.includes('scenes пуст'))).toBe(true);
  });
});

describe('константы типов', () => {
  it('MATERIAL_TYPES покрывает все используемые типы', () => {
    expect(MATERIAL_TYPES).toEqual(['photo', 'pair', 'story', 'video']);
  });

  it('SCENE_TYPES покрывает все типы сцен', () => {
    expect(SCENE_TYPES).toEqual(['cover', 'sections', 'pair', 'material', 'cta']);
  });
});
