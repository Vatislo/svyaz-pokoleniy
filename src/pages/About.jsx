import { getContent } from '../lib/content.js';
import './About.css';

export default function About() {
  const about = getContent().about || {};
  const blocks = Array.isArray(about.blocks) ? about.blocks : [];
  const tech = about.tech || {};

  return (
    <article className="about container">
      <header className="about__head">
        <h1 className="about__title">{about.title || 'О проекте'}</h1>
        {about.lead && <p className="about__lead">{about.lead}</p>}
        {about.notice && (
          <p className="about__notice" role="note">
            {about.notice}
          </p>
        )}
      </header>

      <div className="about__grid">
        {blocks.map((block, i) => (
          <section
            key={block.id || i}
            className="about__block"
            aria-labelledby={`about-${block.id || i}`}
          >
            <h2 className="about__block-title" id={`about-${block.id || i}`}>
              {block.title}
            </h2>
            {block.text && <p className="about__block-text">{block.text}</p>}
          </section>
        ))}
      </div>

      {tech.title && (
        <section className="about__tech" aria-labelledby="about-tech">
          <h2 className="about__block-title" id="about-tech">
            {tech.title}
          </h2>
          {tech.text && <p className="about__block-text">{tech.text}</p>}
        </section>
      )}

      <p className="about__back">
        <a className="btn" href="#/catalog">
          Перейти в каталог материалов
        </a>
      </p>
    </article>
  );
}
