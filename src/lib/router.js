import { useEffect, useState } from 'react'

const ROUTES = ['/', '/catalog', '/about']

function parseHash() {
  const raw = window.location.hash.replace(/^#/, '')
  const [path] = raw.split('?')
  return ROUTES.includes(path) ? path : '/'
}

export function useHashRoute() {
  const [path, setPath] = useState(parseHash)

  useEffect(() => {
    const onChange = () => setPath(parseHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [path])

  return path
}

export function navigate(href) {
  window.location.hash = href.replace(/^#/, '')
}
