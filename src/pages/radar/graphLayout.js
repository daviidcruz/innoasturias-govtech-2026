import { ORDEN_AREAS, AREAS } from '../../data/radar.js'

const W = 1000
const H = 640
const CX = W / 2
const CY = H / 2 + 10
const HUB_RADIUS = 230

// Un hub fijo por área, repartido en círculo. Determinista: no depende de
// cuántas filas haya, así que pantalla y resultados coinciden siempre.
export const HUBS = Object.fromEntries(
  ORDEN_AREAS.map((area, i) => {
    const angle = (i / ORDEN_AREAS.length) * Math.PI * 2 - Math.PI / 2
    return [
      area,
      {
        x: CX + Math.cos(angle) * HUB_RADIUS,
        y: CY + Math.sin(angle) * HUB_RADIUS,
        angle,
        label: AREAS[area],
      },
    ]
  }),
)

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)) // ~137.5°

/**
 * Posición de cada nodo alrededor del hub de su área, en espiral áurea: la
 * misma disposición de las semillas de un girasol. Crece hacia fuera sin
 * solaparse, sin importar cuántos nodos lleguen — no hace falta física de
 * grafo (d3-force) para un contador que solo crece durante un evento y
 * nunca se reorganiza ni se toca con el ratón.
 */
export function layoutNodos(filas) {
  const contadorPorArea = {}
  return filas.map((fila) => {
    const hub = HUBS[fila.area] ?? HUBS.otros
    const i = contadorPorArea[fila.area] ?? 0
    contadorPorArea[fila.area] = i + 1

    const angle = i * GOLDEN_ANGLE
    const radius = 16 + Math.sqrt(i) * 15.5
    return {
      ...fila,
      x: hub.x + Math.cos(angle) * radius,
      y: hub.y + Math.sin(angle) * radius,
      hub,
    }
  })
}

export const VIEWBOX = `0 0 ${W} ${H}`
