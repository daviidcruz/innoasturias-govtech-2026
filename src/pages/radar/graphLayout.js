import { areasDeFila } from '../../data/radar.js'

/**
 * El match del Radar: una Administración con un reto en un área, y una
 * Empresa/Startup/Universidad con una solución en esa misma área — se
 * conectan. Comparar TODAS las áreas de cada una (no solo la principal),
 * porque una respuesta con varias áreas puede hacer match por cualquiera
 * de ellas. Sin match, la tarjeta se queda sola — no todo tiene por qué
 * conectar con algo todavía.
 */
export function calcularMatches(filas) {
  const retos = filas.filter((f) => f.perfil === 'administracion')
  const soluciones = filas.filter((f) => f.perfil !== 'administracion')
  const pares = []
  const emparejadas = new Set()

  for (const reto of retos) {
    const areasReto = areasDeFila(reto)
    for (const sol of soluciones) {
      const areasSol = areasDeFila(sol)
      if (areasReto.some((a) => areasSol.includes(a))) {
        pares.push({ reto: reto.id, solucion: sol.id })
        emparejadas.add(reto.id)
        emparejadas.add(sol.id)
      }
    }
  }
  return { pares, emparejadas }
}
