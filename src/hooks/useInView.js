import { useEffect, useRef, useState } from 'react'

/**
 * Revelado al hacer scroll, y el reloj de la jornada.
 *
 * Antes esto usaba `classList.add('is-in')`. Bug real encontrado en pruebas:
 * los <li> del programa tienen un className que React recalcula en cada
 * render (según cuál sea el bloque "activo"); cada vez que React vuelve a
 * escribir esa cadena, borra cualquier clase añadida por fuera de React —
 * incluida `is-in`. Por eso solo sobrevivían los últimos bloques, los que ya
 * no volvían a re-renderizarse. La marca de "revelado" vive ahora en un
 * atributo (`data-revealed`) que React nunca toca porque no forma parte de
 * ningún prop JSX, así que no hay reconciliación que pueda pisarlo.
 *
 * Además: no se usa IntersectionObserver. En pruebas, un elemento quedó
 * marcado repetidamente como "no visible" mientras que, medido con
 * getBoundingClientRect en ese mismo instante, ocupaba el 76% de la
 * pantalla. En vez de perseguir esa rareza, aquí se mide la posición real en
 * cada scroll (con throttle a un frame), que no puede mentir.
 */
function enViewport(el, margenInferior = 0) {
  const r = el.getBoundingClientRect()
  return r.top < window.innerHeight - margenInferior && r.bottom > 0
}

/** Añade `data-revealed` cuando cada `[data-reveal]` del contenedor entra en pantalla. */
export function useInView() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const targets = el.hasAttribute('data-reveal') ? [el] : []
    el.querySelectorAll('[data-reveal]').forEach((n) => targets.push(n))
    let pendientes = targets.filter((n) => !n.hasAttribute('data-revealed'))
    if (pendientes.length === 0) return

    let ticking = false
    const check = () => {
      ticking = false
      pendientes = pendientes.filter((n) => {
        if (enViewport(n, 40)) {
          n.setAttribute('data-revealed', '')
          return false
        }
        return true
      })
      if (pendientes.length === 0) quitar()
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(check)
    }
    function quitar() {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }

    check()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return quitar
  }, [])

  return ref
}

/**
 * Marca `data-revealed` en un único contenedor (para secuencias
 * coreografiadas como el Radar, donde los hijos se animan por delay).
 */
export function useSectionIn() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let ticking = false
    const check = () => {
      ticking = false
      // Un tercio del panel a la vista basta para arrancar la secuencia
      if (enViewport(el, el.getBoundingClientRect().height * 0.66)) {
        el.setAttribute('data-revealed', '')
        quitar()
      }
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(check)
    }
    function quitar() {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }

    check()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return quitar
  }, [])

  return ref
}

/**
 * El reloj de la jornada: el bloque cuyo centro está más cerca del centro de
 * la ventana es "el que se está leyendo ahora mismo".
 */
export function useClock() {
  const ref = useRef(null)
  const [now, setNow] = useState(-1)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let ticking = false
    const check = () => {
      ticking = false
      const rows = el.querySelectorAll('[data-slot]')
      if (!rows.length) return
      const centro = window.innerHeight / 2
      let mejor = -1
      let mejorDist = Infinity
      rows.forEach((row) => {
        const r = row.getBoundingClientRect()
        if (r.bottom <= 0 || r.top >= window.innerHeight) return
        const dist = Math.abs((r.top + r.bottom) / 2 - centro)
        if (dist < mejorDist) {
          mejorDist = dist
          mejor = Number(row.dataset.slot)
        }
      })
      setNow((prev) => (prev === mejor ? prev : mejor))
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(check)
    }

    check()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return [ref, now]
}
