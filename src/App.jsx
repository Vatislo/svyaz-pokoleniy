
import { Header } from '@/components/Header'
import { Home } from '@/pages/Home'
import { Catalog } from '@/pages/Catalog'
import { NewProject } from '@/pages/NewProject'
import { ProjectDetail } from '@/pages/ProjectDetail'
import Admin from '@/pages/Admin'
import { useHashRoute } from '@/lib/router'
import content from '@/data/content.json'

function Page({ path }) {
  // Страница администратора
  if (path === '/admin') {
    return <Admin />
  }

  if (path === '/create-project') {
    return <NewProject />
  }

  if (path.startsWith('/project/')) {
    return <ProjectDetail id={decodeURIComponent(path.slice('/project/'.length))} />
  }

  // Каталог с поиском
  if (path === '/catalog') {
    const [base, search = ''] = window.location.hash
      .replace(/^#/, '')
      .split('?')

    if (base === '/catalog') {
      return <Catalog search={new URLSearchParams(search)} />
    }
  }

  // Главная страница
  return <Home />
}

export default function App() {
  const path = useHashRoute()

  return (
    <>
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
    </>
  )
}
