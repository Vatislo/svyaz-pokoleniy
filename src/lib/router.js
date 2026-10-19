
import { useEffect, useState } from 'react'

function getCurrentRoute() {
  const hash = window.location.hash

  if (!hash || hash === '#') {
    return '/'
  }

  const route = hash
    .slice(1)
    .split('?')[0]

  // Поддерживаем маршруты вида #/admin
  if (route.startsWith('/')) {
    return route
  }

  return '/'
}

export function useHashRoute() {
  const [path, setPath] = useState(getCurrentRoute)

  useEffect(() => {
    function handleHashChange() {
      setPath(getCurrentRoute())
    }

    window.addEventListener('hashchange', handleHashChange)

    // Синхронизируем маршрут при запуске
    handleHashChange()

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  return path
}
