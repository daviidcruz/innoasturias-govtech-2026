import { useEffect } from 'react'

/**
 * El navegador busca el ancla antes de que React haya montado nada, así que
 * un enlace compartido con #programa se quedaba arriba. Al montar, salta.
 */
export function useHashLanding() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (!id) return
    const el = document.getElementById(id)
    if (!el) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    })
  }, [])
}
