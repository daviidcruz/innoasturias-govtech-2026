import { areasDeFila } from '../../data/radar.js'

/**
 * El match del Radar: una Administración con un reto en un área, y una
 * Empresa/Startup/Universidad con una solución en esa misma área — se
 * conectan. Comparar TODAS las áreas de cada una (no solo la principal),
 * porque una respuesta con varias áreas puede hacer match por cualquiera
 * de ellas. Sin match, la tarjeta se queda sola — no todo tiene por qué
 * conectar con algo todavía.
 *
 * Cada tarjeta se une con como mucho UNA — no se fuerza el match (si no
 * queda ninguna compatible libre, se queda sin pareja), pero tampoco se
 * deja que una sola absorba varias a la vez. Antes emparejaba con TODAS
 * las que compartieran área, así que una respuesta con un área muy
 * genérica (o varias áreas) terminaba con siete u ocho hilos saliendo de
 * ella mientras otras se quedaban sin ninguno. Recorriendo los retos en
 * orden y descartando cada solución en cuanto se usa, el resultado es
 * siempre una pareja 1 a 1: se lee "esta con esta", no "esta con medio
 * mapa".
 */
export function calcularMatches(filas) {
  const retos = filas.filter((f) => f.perfil === 'administracion')
  const soluciones = filas.filter((f) => f.perfil !== 'administracion')
  const pares = []
  const emparejadas = new Set()
  const solucionesLibres = new Set(soluciones.map((s) => s.id))

  for (const reto of retos) {
    const areasReto = areasDeFila(reto)
    const solucion = soluciones.find(
      (sol) => solucionesLibres.has(sol.id) && areasDeFila(sol).some((a) => areasReto.includes(a)),
    )
    if (!solucion) continue
    pares.push({ reto: reto.id, solucion: solucion.id })
    emparejadas.add(reto.id)
    emparejadas.add(solucion.id)
    solucionesLibres.delete(solucion.id)
  }
  return { pares, emparejadas }
}
