import { useId, useState } from 'react';
import MediaImage from './MediaImage.jsx';

import './ThenNowSlider.css';

export default function ThenNowSlider({ before, after, ui, compact = false }) {
  const [value, setValue] = useState(50);
  const id = useId();

  const beforeSrc = before?.src || '';
  const afterSrc = after?.src || '';
  const beforeAlt = before?.alt;
  const afterAlt = after?.alt;
  const beforeCaption = before?.caption;
  const afterCaption = after?.caption;
  const label = ui?.compareLabel || 'Граница сравнения «раньше / сейчас»';
  const beforeLabel = ui?.before || 'Раньше';
  const afterLabel = ui?.after || 'Сейчас';
  const showBeforeText = ui?.showBefore || 'Показать «раньше»';
  const showAfterText = ui?.showAfter || 'Показать «сейчас»';

  return (
    <figure className={`tns ${compact ? 'tns--compact' : ''}`}>
      <div className="tns__stage">
        <MediaImage
          className="tns__layer"
          src={beforeSrc}
          alt={beforeAlt}
          imgClassName="tns__img"
        />
        <div className="tns__after" style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}>
          <MediaImage
            className="tns__layer"
            src={afterSrc}
            alt={afterAlt}
            imgClassName="tns__img"
          />
        </div>

        <span className="tns__badge tns__badge--before">{beforeLabel}</span>
        <span className="tns__badge tns__badge--after">{afterLabel}</span>

        <div className="tns__handle" style={{ left: `${value}%` }} aria-hidden="true">
          <span className="tns__handle-grip">↔</span>
        </div>

        <input
          id={id}
          className="tns__range"
          type="range"
          min="0"
          max="100"
          step="1"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          aria-label={label}
          aria-valuetext={`${value}% — ${afterLabel}, ${100 - value}% — ${beforeLabel}`}
        />
      </div>

      <div className="tns__controls">
        <button
          type="button"
          className="tns__btn"
          aria-pressed={value === 0}
          onClick={() => setValue(0)}
        >
          {showBeforeText}
        </button>
        <button
          type="button"
          className="tns__btn"
          aria-pressed={value === 100}
          onClick={() => setValue(100)}
        >
          {showAfterText}
        </button>
      </div>

      <figcaption className="tns__captions">
        <span>
          <strong>{beforeLabel}</strong>
          {before?.year ? ` · ${before.year}` : ''}
          {beforeCaption ? ` — ${beforeCaption}` : ''}
        </span>
        <span>
          <strong>{afterLabel}</strong>
          {after?.year ? ` · ${after.year}` : ''}
          {afterCaption ? ` — ${afterCaption}` : ''}
        </span>
      </figcaption>
    </figure>
  );
}
