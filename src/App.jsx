import { useCallback, useMemo, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import About from './pages/About.jsx';
import MaterialModal from './components/MaterialModal.jsx';
import { getContent, getMaterials, getUi } from './lib/content.js';
import { useHashRoute } from './lib/hooks.js';

import './App.css';

export default function App() {
  const content = getContent();
  const { path, query } = useHashRoute();
  const [modalId, setModalId] = useState(null);

  const materials = useMemo(() => getMaterials(), []);

  const openMaterial = useCallback((id) => setModalId(id), []);
  const closeModal = useCallback(() => setModalId(null), []);

  const navigateModal = useCallback(
    (dir) => {
      if (!modalId || materials.length === 0) return;
      const idx = materials.findIndex((m) => m && m.id === modalId);
      if (idx < 0) return;
      const next = (idx + dir + materials.length) % materials.length;
      setModalId(materials[next].id);
    },
    [modalId, materials],
  );

  const ui = getUi();
  const mainRef = useRef(null);
  const initialSection = path.startsWith('/catalog') ? query.get('section') || '' : '';

  const onSkip = useCallback((e) => {
    e.preventDefault();
    const node = mainRef.current;
    if (node) {
      node.focus();
      node.scrollIntoView({ block: 'start' });
    }
  }, []);

  let page;
  if (path.startsWith('/catalog')) {
    page = <Catalog onOpenMaterial={openMaterial} initialSection={initialSection} />;
  } else if (path.startsWith('/about')) {
    page = <About />;
  } else {
    page = <Home project={content.project} onOpenMaterial={openMaterial} />;
  }

  return (
    <div className="app">
      <a className="skip-link" href="#main" onClick={onSkip}>
        {ui?.nav?.skipToContent || 'Перейти к содержимому'}
      </a>
      <Header project={content.project} ui={ui} route={path} />
      <main id="main" className="app__main" tabIndex={-1} ref={mainRef}>
        {page}
      </main>
      <Footer footer={content.footer} />
      {modalId && (
        <MaterialModal
          materialId={modalId}
          onClose={closeModal}
          onNavigate={navigateModal}
          onOpenMaterial={openMaterial}
        />
      )}
    </div>
  );
}
