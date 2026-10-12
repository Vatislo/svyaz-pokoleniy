import { useCallback, useEffect, useRef } from 'react';
import MediaImage from './MediaImage.jsx';
import ThenNowSlider from './ThenNowSlider.jsx';

import {
  getMaterial,
  getMaterials,
  getSection,
  getUi,
  relatedMaterials,
  resolveAsset,
  typeLabel,
} from '../lib/content.js';
import './MaterialModal.css';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function MaterialModal({ materialId, onClose, onNavigate, onOpenMaterial }) {
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);
  const ui = getUi();
  const mui = ui.material || {};

  const material = getMaterial(materialId);
  const section = material ? getSection(material.sectionId) : null;

  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    const { style } = document.body;
    const prevOverflow = style.overflow;
    style.overflow = 'hidden';
    const node = dialogRef.current;
    const first = node?.querySelector(FOCUSABLE);
    (first || node)?.focus();
    return () => {
      style.overflow = prevOverflow;
      const prev = previouslyFocused.current;
      if (prev && typeof prev.focus === 'function') prev.focus();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const node = dialogRef.current;
      if (!node) return;
      const items = Array.from(node.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const onBackdrop = useCallback(
    (e) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!material) {
    return (
      <div className="modal__backdrop" onClick={onBackdrop}>
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-notfound-title"
          ref={dialogRef}
          tabIndex={-1}
        >
          <div className="modal__head">
            <h2 className="modal__title" id="modal-notfound-title">
              {mui.notFoundTitle || 'Материал не найден'}
            </h2>
            <button type="button" className="modal__close" onClick={onClose}>
              {ui.material?.close || 'Закрыть'}
              <span aria-hidden="true">✕</span>
            </button>
          </div>
          <p className="modal__text">
            {mui.notFoundText ||
              'Возможно, запись была удалена. Вернитесь в каталог и выберите другой материал.'}
          </p>
        </div>
      </div>
    );
  }

  const title = material.title;
  const description = material.description;
  const author = material.author;
  const date = material.date;
  const source = material.source;
  const tags = Array.isArray(material.tags) ? material.tags.filter(Boolean) : [];
  const typeName = typeLabel(material.type);

  const related = relatedMaterials(getMaterials(), material.id, { limit: 3 });
  const crumbs = [
    { label: ui?.nav?.home || 'Главная', href: '#/' },
    { label: ui?.catalog?.title || 'Каталог', href: '#/catalog' },
    ...(section ? [{ label: section.title, href: `#/catalog?section=${section.id}` }] : []),
    { label: title, current: true },
  ];

  return (
    <div className="modal__backdrop" onClick={onBackdrop}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="modal__head">
          <div className="modal__head-text">
            {typeName && <p className="modal__kicker">{typeName}</p>}
            <h2 className="modal__title" id="modal-title">
              {title}
            </h2>
          </div>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label={`${mui.close || 'Закрыть'}: ${title}`}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <nav className="modal__breadcrumbs" aria-label={mui.breadcrumbsLabel || 'Хлебные крошки'}>
          <ol className="modal__crumbs">
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <li className="modal__crumb" key={`${c.label}-${i}`}>
                  {c.current || last ? (
                    <span className="modal__crumb-current" aria-current="page">
                      {c.label}
                    </span>
                  ) : (
                    <a className="modal__crumb-link" href={c.href} onClick={onClose}>
                      {c.label}
                    </a>
                  )}
                  {!last && (
                    <span className="modal__crumb-sep" aria-hidden="true">
                      /
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="modal__media">
          {material.type === 'pair' ? (
            <ThenNowSlider before={material.before} after={material.after} ui={ui.material} />
          ) : material.type === 'video' ? (
            material.video?.src ? (
              <video
                className="modal__video"
                controls
                preload="metadata"
                poster={resolveAsset(material.video.poster) || undefined}
                src={resolveAsset(material.video.src)}
              >
                <track kind="captions" />
              </video>
            ) : (
              <div className="modal__video-missing" role="note">
                <MediaImage src={material.video?.poster || material.image} alt={title} />
                <p className="modal__video-missing-text">
                  {mui.videoMissing ||
                    'Видеофайл не приложен. Укажите адрес в поле video.src файла src/data/content.json.'}
                </p>
              </div>
            )
          ) : (
            <MediaImage className="modal__image" src={material.image} alt={material.alt || title} />
          )}
        </div>

        <div className="modal__content">
          {description && <p className="modal__text">{description}</p>}

          <dl className="modal__meta">
            {section && (
              <div>
                <dt>{mui.sectionLabel || 'Раздел'}</dt>
                <dd>{section.title}</dd>
              </div>
            )}
            <div>
              <dt>{mui.authorLabel || 'Автор'}</dt>
              <dd>{author || mui.authorMissing || 'Автор не указан'}</dd>
            </div>
            {date && (
              <div>
                <dt>{mui.dateLabel || 'Дата'}</dt>
                <dd>{date}</dd>
              </div>
            )}
            {source && (
              <div>
                <dt>{mui.sourceLabel || 'Источник'}</dt>
                <dd>{source}</dd>
              </div>
            )}
          </dl>

          {tags.length > 0 && (
            <p className="modal__tags">
              <span className="modal__tags-label">{mui.tagsLabel || 'Теги'}:</span>
              {tags.join(', ')}
            </p>
          )}

          <p className="modal__demo">
            <span className="modal__demo-badge">
              {mui.demoBadge || 'Демонстрационный материал'}
            </span>
          </p>
        </div>

        {related.length > 0 && (
          <section className="modal__related" aria-labelledby="modal-related-title">
            <h3 className="modal__related-title" id="modal-related-title">
              {mui.relatedTitle || 'Похожие материалы'}
            </h3>
            <ul className="modal__related-list">
              {related.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className="modal__related-item"
                    onClick={() => onOpenMaterial?.(r.id)}
                  >
                    <span className="modal__related-item-type">{typeLabel(r.type)}</span>
                    <span className="modal__related-item-title">{r.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="modal__foot">
          {typeof onNavigate === 'function' && (
            <div className="modal__nav">
              <button type="button" className="modal__nav-btn" onClick={() => onNavigate(-1)}>
                ← Предыдущий
              </button>
              <button type="button" className="modal__nav-btn" onClick={() => onNavigate(1)}>
                Следующий →
              </button>
            </div>
          )}
          <button type="button" className="btn modal__done" onClick={onClose}>
            {mui.close || 'Закрыть'}
          </button>
        </div>
      </div>
    </div>
  );
}
