import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { MaterialDialogProvider } from '@/components/MaterialDialog'
import { Home } from '@/pages/Home'
import { Catalog } from '@/pages/Catalog'
import { About } from '@/pages/About'
import { useHashRoute } from '@/lib/router'
import content from '@/data/content.json'

function Page({ path }) {
  if (path === '/catalog') {
    const [base, search = ''] = window.location.hash.replace(/^#/, '').split('?')
    if (base === '/catalog') {
      return <Catalog search={new URLSearchParams(search)} />
    }
  }
  if (path === '/about') return <About />
  return <Home />
}

export default function App() {
  const path = useHashRoute()

  return (
    <MaterialDialogProvider>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-graphite focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-stone"
      >
        {content.ui.skipToContent}
      </a>
      <Header path={path} />
      <main id="content">
        <Page path={path} />
      </main>
      <Footer />
    </MaterialDialogProvider>
  )
}
