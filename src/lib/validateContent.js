/**
 * Чистая логика валидации контента — используется скриптом scripts/validate-content.mjs
 * и тестами. Не зависит от файловой системы: проверка существования файлов
 * передаётся колбэком.
 */

export const MATERIAL_TYPES = ['photo', 'pair', 'story', 'video'];
export const SCENE_TYPES = ['cover', 'sections', 'pair', 'material', 'cta'];
export const TOP_LEVEL_KEYS = [
  'project',
  'ui',
  'scenes',
  'sections',
  'materials',
  'about',
  'footer',
];

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isFilledString = (v) => typeof v === 'string' && v.trim().length > 0;

/**
 * @param {unknown} data - разобранный content.json
 * @param {{ fileExists?: (src: string) => boolean }} [options]
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateContent(data, options = {}) {
  const { fileExists } = options;
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);

  if (!isObj(data)) {
    err('Корень JSON должен быть объектом');
    return { errors, warnings };
  }

  for (const key of TOP_LEVEL_KEYS) {
    if (!(key in data)) err(`Отсутствует обязательный раздел «${key}»`);
  }

  function checkText(value, where) {
    if (typeof value !== 'string') {
      err(`${where}: ожидалась строка, получено ${typeof value}`);
      return;
    }
    if (!value.trim()) warn(`${where}: строка пуста`);
  }

  // --- Секции ---
  const sections = Array.isArray(data.sections) ? data.sections : [];
  const sectionIds = new Set();
  if (sections.length === 0) err('Массив sections пуст');
  sections.forEach((s, i) => {
    const where = `sections[${i}]`;
    if (!isObj(s)) return err(`${where}: должен быть объект`);
    if (!isFilledString(s.id)) err(`${where}: отсутствует строковый id`);
    else if (sectionIds.has(s.id)) err(`${where}: дублируется id «${s.id}»`);
    else sectionIds.add(s.id);
    if (!s.title) err(`${where}: отсутствует title`);
    else checkText(s.title, `${where}.title`);
  });

  // --- Материалы ---
  const materials = Array.isArray(data.materials) ? data.materials : [];
  const materialIds = new Set();
  if (materials.length === 0) err('Массив materials пуст');
  materials.forEach((m, i) => {
    const where = `materials[${i}]`;
    if (!isObj(m)) return err(`${where}: должен быть объект`);
    if (!isFilledString(m.id)) err(`${where}: отсутствует строковый id`);
    else if (materialIds.has(m.id)) err(`${where}: дублируется id «${m.id}»`);
    else materialIds.add(m.id);

    if (!isFilledString(m.sectionId)) err(`${where}: отсутствует sectionId`);
    else if (!sectionIds.has(m.sectionId))
      err(`${where}: sectionId «${m.sectionId}» не найден в sections`);

    if (!isFilledString(m.type)) err(`${where}: отсутствует type`);
    else if (!MATERIAL_TYPES.includes(m.type)) err(`${where}: неизвестный type «${m.type}»`);

    if (!m.title) err(`${where}: отсутствует title`);
    else checkText(m.title, `${where}.title`);

    if (m.type === 'pair') {
      if (!isObj(m.before) || !isFilledString(m.before.src))
        err(`${where}: для type=pair нужен before.src`);
      if (!isObj(m.after) || !isFilledString(m.after.src))
        err(`${where}: для type=pair нужен after.src`);
    } else if (m.type === 'video') {
      if (m.video === undefined) warn(`${where}: type=video без поля video — плеер не появится`);
      else if (!isObj(m.video) || typeof m.video.src !== 'string')
        err(`${where}: video должен быть объектом со строковым src`);
    } else if (!isFilledString(m.image)) {
      warn(`${where}: отсутствует image (карточка покажет fallback)`);
    }
  });

  // --- Сцены ---
  const scenes = Array.isArray(data.scenes) ? data.scenes : [];
  const sceneIds = new Set();
  if (scenes.length === 0) warn('Массив scenes пуст — будет построен сценарий по умолчанию');
  scenes.forEach((sc, i) => {
    const where = `scenes[${i}]`;
    if (!isObj(sc)) return err(`${where}: должен быть объект`);
    if (isFilledString(sc.id)) {
      if (sceneIds.has(sc.id)) err(`${where}: дублируется id сцены «${sc.id}»`);
      sceneIds.add(sc.id);
    }
    if (!isFilledString(sc.type)) err(`${where}: отсутствует type`);
    else if (!SCENE_TYPES.includes(sc.type)) err(`${where}: неизвестный type сцены «${sc.type}»`);

    if (sc.type === 'sections' && Array.isArray(sc.sectionIds)) {
      sc.sectionIds.forEach((sid, j) => {
        if (!sectionIds.has(sid)) err(`${where}.sectionIds[${j}]: «${sid}» не найден в sections`);
      });
    }
    if ((sc.type === 'pair' || sc.type === 'material') && isFilledString(sc.materialId)) {
      if (!materialIds.has(sc.materialId))
        err(`${where}: materialId «${sc.materialId}» не найден в materials`);
    }
    if (sc.type === 'pair' && isFilledString(sc.materialId)) {
      const m = materials.find((x) => isObj(x) && x.id === sc.materialId);
      if (m && m.type !== 'pair') err(`${where}: материал «${sc.materialId}» не имеет type=pair`);
    }
  });

  // --- Ссылки на изображения ---
  const imageRefs = [];
  const collect = (src, where) => {
    if (isFilledString(src)) imageRefs.push([src, where]);
  };
  if (isObj(data.project?.cover)) collect(data.project.cover.image, 'project.cover.image');
  sections.forEach((s, i) => collect(isObj(s) ? s.image : undefined, `sections[${i}].image`));
  materials.forEach((m, i) => {
    if (!isObj(m)) return;
    collect(m.image, `materials[${i}].image`);
    collect(m.before?.src, `materials[${i}].before.src`);
    collect(m.after?.src, `materials[${i}].after.src`);
    collect(m.video?.poster, `materials[${i}].video.poster`);
  });

  if (typeof fileExists === 'function') {
    for (const [src, where] of imageRefs) {
      if (/^(https?:|data:)/.test(src)) continue;
      if (!fileExists(src)) err(`${where}: файл изображения «${src}» не найден в public/`);
    }
  }

  return { errors, warnings, stats: { sections, materials, scenes, imageRefs } };
}
