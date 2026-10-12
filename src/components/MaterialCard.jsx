import MediaImage from './MediaImage.jsx';

import { getSection, typeLabel } from '../lib/content.js';
import './MaterialCard.css';

export default function MaterialCard({ material, ui, onOpen }) {
  if (!material) return null;

  const title = material.title;
  const summary = material.summary;
  const section = getSection(material.sectionId);
  const sectionName = section?.title;
  const typeName = typeLabel(material.type);

  const previewSrc =
    material.type === 'pair'
      ? material.before?.src || material.image
      : material.type === 'video'
        ? material.video?.poster || material.image
        : material.image;

  const previewAlt =
    material.type === 'pair' ? material.before?.alt || title : material.alt || title;

  return (
    <article className="card">
      <div className="card__media-wrap">
        <MediaImage
          className={`card__media card__media--${material.type || 'photo'}`}
          src={previewSrc}
          alt={previewAlt}
        />
        {material.type === 'pair' && <span className="card__corner">раньше / сейчас</span>}
        {material.type === 'video' && <span className="card__corner">видео</span>}
      </div>

      <div className="card__body">
        <p className="card__meta">
          {sectionName && <span className="card__section">{sectionName}</span>}
          {typeName && <span className="card__type">{typeName}</span>}
        </p>
        <h3 className="card__title">{title}</h3>
        {summary && <p className="card__summary">{summary}</p>}
        <button
          type="button"
          className="card__open"
          onClick={() => onOpen(material.id)}
          aria-haspopup="dialog"
        >
          {ui?.catalog?.open || 'Подробнее'}
          <span className="visually-hidden">: {title}</span>
        </button>
      </div>
    </article>
  );
}
