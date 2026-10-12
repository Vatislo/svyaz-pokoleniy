import { useEffect, useMemo, useRef } from 'react';
import MediaImage from '../components/MediaImage.jsx';
import ThenNowSlider from '../components/ThenNowSlider.jsx';

import { buildScenes, getSections, getUi } from '../lib/content.js';
import { useMediaQuery, usePrefersReducedMotion } from '../lib/hooks.js';
import { useSceneSnap } from '../lib/useSceneSnap.js';
import './Home.css';

function SceneCover({ project, ui, onGoSections }) {
  const cover = project?.cover || {};
  return (
    <div className="scene scene--cover">
      <MediaImage
        className="scene__bg"
        src={cover.image}
        alt={cover.alt}
        tone="dark"
        imgClassName="scene__bg-img"
      />
      <div className="scene__veil" aria-hidden="true" />
      <div className="scene__content container scene__content--cover">
        {cover.kicker && <p className="scene__kicker">{cover.kicker}</p>}
        <h1 className="scene__title">{cover.title || project?.title}</h1>
        {cover.subtitle && <p className="scene__lead">{cover.subtitle}</p>}
        <div className="scene__actions">
          <button type="button" className="btn btn--light" onClick={onGoSections}>
            {ui?.home?.goToSections || 'Перейти к разделам'}
          </button>
        </div>
        {cover.note && <p className="scene__note">{cover.note}</p>}
      </div>
    </div>
  );
}

function SceneSections({ scene, ui, sectionMap }) {
  const items = (scene.sectionIds || []).map((id) => sectionMap.get(id)).filter(Boolean);
  return (
    <div className="scene scene--sections">
      <div className="scene__content container">
        <h2 className="scene__heading">{scene.title}</h2>
        {scene.text && <p className="scene__text">{scene.text}</p>}
        <ul className="scene__sections">
          {items.map((s) => (
            <li key={s.id} className="scene-section">
              <MediaImage className="scene-section__media" src={s.image} alt={s.alt} />
              <div className="scene-section__body">
                <h3 className="scene-section__title">{s.title}</h3>
                {s.description && <p className="scene-section__desc">{s.description}</p>}
                <a
                  className="scene-section__link"
                  href={`#/catalog?section=${encodeURIComponent(s.id)}`}
                >
                  {ui?.home?.sectionOpen || 'Смотреть раздел'}
                  <span className="visually-hidden">: {s.title}</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ScenePair({ scene, ui }) {
  const material = scene.material;
  return (
    <div className="scene scene--pair">
      <div className="scene__content container scene__content--split">
        <div className="scene__text-col">
          <h2 className="scene__heading">{scene.title}</h2>
          {scene.text && <p className="scene__text">{scene.text}</p>}
          <p className="scene__material-title">{material?.title}</p>
          {material?.summary && <p className="scene__text">{material.summary}</p>}
        </div>
        <div className="scene__media-col">
          <ThenNowSlider
            before={material?.before}
            after={material?.after}
            ui={ui?.material}
            compact
          />
        </div>
      </div>
    </div>
  );
}

function SceneMaterial({ scene, ui, onOpen }) {
  const material = scene.material;
  return (
    <div className="scene scene--material">
      <div className="scene__content container scene__content--split">
        <div className="scene__media-col">
          <MediaImage
            className="scene__feature-media"
            src={material?.image}
            alt={material?.alt || material?.title}
          />
        </div>
        <div className="scene__text-col">
          <h2 className="scene__heading">{scene.title}</h2>
          {scene.text && <p className="scene__text">{scene.text}</p>}
          <p className="scene__material-title">{material?.title}</p>
          {material?.description && <p className="scene__text">{material.description}</p>}
          <div className="scene__actions">
            <button
              type="button"
              className="btn"
              onClick={() => material && onOpen(material.id)}
              aria-haspopup="dialog"
            >
              {ui?.home?.materialOpen || 'Открыть материал'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneCta({ scene }) {
  const action = scene.action || {};
  return (
    <div className="scene scene--cta">
      <div className="scene__content container scene__content--cta">
        <h2 className="scene__heading scene__heading--cta">{scene.title}</h2>
        {scene.text && <p className="scene__text scene__text--cta">{scene.text}</p>}
        {action.href && (
          <div className="scene__actions">
            <a className="btn btn--light" href={action.href}>
              {action.label}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function SceneFallback({ scene, ui }) {
  return (
    <div className="scene scene--cta">
      <div className="scene__content container scene__content--cta">
        <h2 className="scene__heading">{scene.title || ui?.home?.sceneFallbackTitle}</h2>
        {scene.text && <p className="scene__text">{scene.text}</p>}
        <div className="scene__actions">
          <a className="btn btn--light" href="#/catalog">
            {ui?.nav?.catalog || 'Каталог'}
          </a>
        </div>
      </div>
    </div>
  );
}

export default function Home({ project, onOpenMaterial }) {
  const ui = getUi();
  const scenes = useMemo(() => buildScenes(), []);
  const sections = useMemo(() => getSections(), []);
  const sectionMap = useMemo(() => new Map(sections.map((s) => [s.id, s])), [sections]);

  const isDesktop = useMediaQuery('(min-width: 900px)');
  const reducedMotion = usePrefersReducedMotion();
  const snapEnabled = isDesktop;
  const containerRef = useRef(null);
  const { index, goTo } = useSceneSnap(containerRef, scenes.length, { enabled: snapEnabled });

  useEffect(() => {
    document.title = `${project?.title} — архив памяти`;
  }, [project]);

  const goSections = () => {
    const target = scenes.findIndex((s) => s.type === 'sections');
    if (target >= 0 && target !== index) goTo(target);
    else window.location.hash = '#/catalog';
  };

  const onNavClick = (i) => {
    if (snapEnabled) {
      goTo(i);
      const sceneEl = containerRef.current?.children[i];
      if (sceneEl instanceof HTMLElement) sceneEl.focus({ preventScroll: true });
    } else {
      const sceneEl = containerRef.current?.children[i];
      if (sceneEl instanceof HTMLElement) {
        sceneEl.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className={`home ${snapEnabled ? 'home--snap' : 'home--flow'}`}>
      <div
        className="home__scenes"
        ref={containerRef}
        role="group"
        aria-label={ui?.home?.scenesNavLabel || 'Сцены главной страницы'}
      >
        {scenes.map((scene, i) => {
          const active = !snapEnabled || i === index;
          let content;
          switch (scene.type) {
            case 'cover':
              content = <SceneCover project={project} ui={ui} onGoSections={goSections} />;
              break;
            case 'sections':
              content = <SceneSections scene={scene} ui={ui} sectionMap={sectionMap} />;
              break;
            case 'pair':
              content = <ScenePair scene={scene} ui={ui} />;
              break;
            case 'material':
              content = <SceneMaterial scene={scene} ui={ui} onOpen={onOpenMaterial} />;
              break;
            case 'cta':
              content = <SceneCta scene={scene} />;
              break;
            default:
              content = <SceneFallback scene={scene} ui={ui} />;
          }
          return (
            <section
              key={scene.id || `scene-${i}`}
              className={`home__scene ${active ? 'home__scene--active' : ''}`}
              aria-label={scene.navTitle || undefined}
              aria-hidden={snapEnabled ? !active : undefined}
              tabIndex={snapEnabled ? (active ? 0 : -1) : undefined}
              ref={(node) => {
                if (node) {
                  node.style.outline = 'none';
                }
              }}
            >
              {content}
            </section>
          );
        })}
      </div>

      <nav
        className={`home__dots ${snapEnabled ? '' : 'home__dots--flow'}`}
        aria-label={ui?.home?.scenesNavLabel || 'Сцены главной страницы'}
      >
        <ol className="home__dots-list">
          {scenes.map((scene, i) => {
            const current = snapEnabled ? i === index : undefined;
            return (
              <li key={scene.id || `dot-${i}`}>
                <button
                  type="button"
                  className={`home__dot ${snapEnabled && i === index ? 'home__dot--active' : ''}`}
                  aria-current={current ? 'true' : undefined}
                  onClick={() => onNavClick(i)}
                >
                  <span className="home__dot-index">{String(i + 1).padStart(2, '0')}</span>
                  <span className="home__dot-label">{scene.navTitle}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
