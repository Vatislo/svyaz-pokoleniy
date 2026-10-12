import { useMemo, useState } from 'react';
import MaterialCard from '../components/MaterialCard.jsx';

import {
  filterMaterials,
  getMaterials,
  getSections,
  getUi,
  randomMaterial,
  typeLabel,
} from '../lib/content.js';
import './Catalog.css';

const TYPE_ORDER = ['photo', 'pair', 'story', 'video'];

export default function Catalog({ onOpenMaterial, initialSection = '' }) {
  const ui = getUi();
  const cui = ui.catalog || {};
  const sections = getSections();
  const materials = useMemo(() => getMaterials(), []);

  const [query, setQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState(initialSection);
  const [typeFilter, setTypeFilter] = useState('');

  // Обновляем фильтр, когда в адресе изменился раздел (например, переход со главной).
  // Синхронизация во время рендера — без эффекта и лишних циклов.
  const [prevInitialSection, setPrevInitialSection] = useState(initialSection);
  if (initialSection !== prevInitialSection) {
    setPrevInitialSection(initialSection);
    setSectionFilter(initialSection);
  }

  const typesPresent = useMemo(() => {
    const present = new Set(materials.map((m) => m.type).filter(Boolean));
    return TYPE_ORDER.filter((type) => present.has(type));
  }, [materials]);

  const results = useMemo(
    () => filterMaterials(materials, { query, sectionId: sectionFilter, type: typeFilter }),
    [materials, query, sectionFilter, typeFilter],
  );

  const reset = () => {
    setQuery('');
    setSectionFilter('');
    setTypeFilter('');
  };

  return (
    <section className="catalog container" aria-labelledby="catalog-title">
      <header className="catalog__head">
        <h1 className="catalog__title" id="catalog-title">
          {cui.title || 'Каталог материалов'}
        </h1>
        {cui.lead && <p className="catalog__lead">{cui.lead}</p>}
      </header>

      <div className="catalog__filters">
        <div className="catalog__search">
          <label className="catalog__label" htmlFor="catalog-search">
            {cui.searchLabel || 'Поиск по материалам'}
          </label>
          <input
            id="catalog-search"
            type="search"
            className="catalog__input"
            placeholder={cui.searchPlaceholder || 'Название, автор или слово из описания…'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <fieldset className="catalog__group">
          <legend className="catalog__label">{cui.sectionsLabel || 'Раздел'}</legend>
          <div className="catalog__chips" role="group">
            <button
              type="button"
              className="catalog__chip"
              aria-pressed={sectionFilter === ''}
              onClick={() => setSectionFilter('')}
            >
              <span className="catalog__chip-mark" aria-hidden="true">
                {sectionFilter === '' ? '●' : '○'}
              </span>
              {cui.allSections || 'Все разделы'}
            </button>
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                className="catalog__chip"
                aria-pressed={sectionFilter === s.id}
                onClick={() => setSectionFilter(s.id)}
              >
                <span className="catalog__chip-mark" aria-hidden="true">
                  {sectionFilter === s.id ? '●' : '○'}
                </span>
                {s.title}
              </button>
            ))}
          </div>
        </fieldset>

        {typesPresent.length > 0 && (
          <fieldset className="catalog__group">
            <legend className="catalog__label">{cui.typesLabel || 'Тип материала'}</legend>
            <div className="catalog__chips" role="group">
              <button
                type="button"
                className="catalog__chip"
                aria-pressed={typeFilter === ''}
                onClick={() => setTypeFilter('')}
              >
                <span className="catalog__chip-mark" aria-hidden="true">
                  {typeFilter === '' ? '●' : '○'}
                </span>
                {cui.allTypes || 'Все типы'}
              </button>
              {typesPresent.map((type) => (
                <button
                  key={type}
                  type="button"
                  className="catalog__chip"
                  aria-pressed={typeFilter === type}
                  onClick={() => setTypeFilter(typeFilter === type ? '' : type)}
                >
                  <span className="catalog__chip-mark" aria-hidden="true">
                    {typeFilter === type ? '●' : '○'}
                  </span>
                  {typeLabel(type)}
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </div>

      <div className="catalog__toolbar">
        <p className="catalog__count" role="status" aria-live="polite">
          {(cui.resultsCount || 'Найдено материалов: {count}').replace(
            '{count}',
            String(results.length),
          )}
        </p>
        {materials.length > 1 && (
          <button
            type="button"
            className="catalog__random"
            onClick={() => {
              const pick = randomMaterial(materials, null);
              if (pick) onOpenMaterial(pick.id);
            }}
            aria-haspopup="dialog"
          >
            {cui.randomButton || 'Случайный материал'}
          </button>
        )}
      </div>

      {results.length > 0 ? (
        <ul className="catalog__grid">
          {results.map((m) => (
            <li key={m.id}>
              <MaterialCard material={m} ui={ui} onOpen={onOpenMaterial} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="catalog__empty" role="status">
          <h2 className="catalog__empty-title">{cui.emptyTitle || 'Ничего не найдено'}</h2>
          <p className="catalog__empty-text">
            {cui.emptyText ||
              'Попробуйте изменить запрос или сбросить фильтры — в архиве есть другие материалы.'}
          </p>
          <button type="button" className="btn" onClick={reset}>
            {cui.reset || 'Сбросить фильтры'}
          </button>
        </div>
      )}
    </section>
  );
}
