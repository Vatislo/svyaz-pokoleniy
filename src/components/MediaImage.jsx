import { useState } from 'react';
import './MediaImage.css';

export default function MediaImage({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  tone = 'paper',
  sizes,
  children,
}) {
  // Запоминаем, для какого src случилась ошибка: при смене src state автоматически
  // «обнуляется», поэтому эффект для сброса не нужен.
  const [failedSrc, setFailedSrc] = useState(null);
  const failed = Boolean(src) && failedSrc === src;

  const altText = typeof alt === 'string' ? alt.trim() : '';

  if (!src || failed) {
    return (
      <div
        className={`media media--fallback media--fallback-${tone} ${className}`}
        role="img"
        aria-label={altText || 'Изображение недоступно'}
      >
        <span className="media__fallback-mark" aria-hidden="true">
          ✦
        </span>
        <span className="media__fallback-text">
          {altText ? `${altText} — изображение недоступно` : 'Изображение недоступно'}
        </span>
        {children}
      </div>
    );
  }

  return (
    <div className={`media ${className}`}>
      <img
        className={`media__img ${imgClassName}`}
        src={src}
        alt={altText}
        sizes={sizes}
        loading="lazy"
        decoding="async"
        onError={() => setFailedSrc(src)}
      />
      {children}
    </div>
  );
}
