import content from '../data/content.json';

export function getContent() {
  return content;
}

export function getUi() {
  return content.ui || {};
}

export function getSections() {
  return Array.isArray(content.sections) ? content.sections : [];
}

export function getMaterials() {
  return Array.isArray(content.materials) ? content.materials : [];
}

export function getSection(id) {
  return getSections().find((s) => s && s.id === id) || null;
}

export function getMaterial(id) {
  return getMaterials().find((m) => m && m.id === id) || null;
}

export function sectionTitle(id) {
  const section = getSection(id);
  return section ? section.title : '';
}

export function typeLabel(type) {
  const types = getUi().types || {};
  return types[type] || '';
}

/**
 * Поиск и фильтрация материалов каталога.
 * @param {Array} materials - материалы
 * @param {{ query?: string, sectionId?: string, type?: string }} filters
 * @returns {Array} отфильтрованные материалы
 */
export function filterMaterials(materials, filters = {}) {
  const list = Array.isArray(materials) ? materials : [];
  const query = typeof filters.query === 'string' ? filters.query.trim().toLowerCase() : '';
  const sectionId = filters.sectionId || '';
  const type = filters.type || '';

  return list.filter((m) => {
    if (!m || typeof m !== 'object') return false;
    if (sectionId && m.sectionId !== sectionId) return false;
    if (type && m.type !== type) return false;
    if (!query) return true;
    const haystack = [
      m.title,
      m.summary,
      m.description,
      m.author,
      m.source,
      sectionTitle(m.sectionId),
      typeLabel(m.type),
      Array.isArray(m.tags) ? m.tags.join(' ') : '',
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });
}

/**
 * Материалы, похожие на заданный: совпадение по тегам, затем по разделу.
 * Возвращает до `limit` штук, исключая сам материал.
 */
export function relatedMaterials(materials, currentId, { limit = 3 } = {}) {
  const list = Array.isArray(materials) ? materials.filter((m) => m && m.id !== currentId) : [];
  const current = (Array.isArray(materials) ? materials : []).find((m) => m && m.id === currentId);
  if (!current) return list.slice(0, limit);

  const tags = Array.isArray(current.tags) ? current.tags.filter(Boolean) : [];
  const scored = list.map((m) => {
    const mTags = Array.isArray(m.tags) ? m.tags.filter(Boolean) : [];
    let score = mTags.filter((tag) => tags.includes(tag)).length * 2;
    if (m.sectionId && m.sectionId === current.sectionId) score += 1;
    return { m, score };
  });

  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.m);
}

/** Случайный материал, отличный от currentId. */
export function randomMaterial(materials, currentId) {
  const list = (Array.isArray(materials) ? materials : []).filter((m) => m && m.id !== currentId);
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

const FALLBACK_SCENES = 'ui.home.sceneFallbackTitle';

export function buildScenes() {
  const raw = Array.isArray(content.scenes) ? content.scenes : [];
  const materials = getMaterials();
  const sections = getSections();
  const out = [];

  for (const scene of raw) {
    if (!scene || typeof scene !== 'object') continue;
    switch (scene.type) {
      case 'cover': {
        out.push({ ...scene, id: scene.id || 'cover' });
        break;
      }
      case 'sections': {
        const requested = Array.isArray(scene.sectionIds) ? scene.sectionIds : [];
        let ids = requested.filter((id) => sections.some((sec) => sec && sec.id === id));
        if (ids.length === 0) ids = sections.slice(0, 3).map((sec) => sec.id);
        if (ids.length === 0) break;
        out.push({ ...scene, sectionIds: ids });
        break;
      }
      case 'pair': {
        const material = materials.find(
          (m) => m && m.id === scene.materialId && m.type === 'pair' && m.before && m.after,
        );
        if (!material) break;
        out.push({ ...scene, material });
        break;
      }
      case 'material': {
        const material = materials.find((m) => m && m.id === scene.materialId);
        if (!material) break;
        out.push({ ...scene, material });
        break;
      }
      case 'cta': {
        out.push(scene);
        break;
      }
      default:
        break;
    }
  }

  if (out.length === 0) {
    out.push({ id: 'cover-fallback', type: 'cover' });
    const first = materials[0];
    if (first) {
      out.push({
        id: 'material-fallback',
        type: 'material',
        material: first,
        title: content.ui?.home?.[FALLBACK_SCENES] || 'Материалы архива',
        text: '',
      });
    }
    out.push({
      id: 'cta-fallback',
      type: 'cta',
      title: 'Добавьте в архив свою историю',
      text: '',
      action: { label: 'Как участвовать', href: '#/about' },
    });
  }

  return out;
}
