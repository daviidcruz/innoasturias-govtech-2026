import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PERFILES, etiquetaNodo } from '../../data/radar.js'
import { HUBS, layoutNodos, VIEWBOX } from './graphLayout.js'

/**
 * El grafo en sí: hubs por área (fijos) + un nodo por respuesta, conectado
 * a su hub. Compartido entre /radar/pantalla (en vivo) y /radar/resultados
 * (estático) — la única diferencia entre ambos es de dónde sacan `filas`.
 *
 * Conexión nodo–nodo directa entre todos los que comparten área se descartó
 * a propósito: con muchas respuestas en la misma área forma una maraña
 * (n·(n-1)/2 líneas). Cada nodo conecta solo con el hub de su área — mismo
 * agrupamiento visual, sin ese crecimiento cuadrático.
 */
export default function RadarGraph({ filas, reciente }) {
  const [hover, setHover] = useState(null)
  const nodos = useMemo(() => layoutNodos(filas), [filas])
  const activo = nodos.find((n) => n.id === hover)

  return (
    <div className="relative aspect-[1000/640] w-full">
      <svg viewBox={VIEWBOX} className="h-full w-full overflow-visible">
        {/* Anclas de cada área: siempre visibles, aunque no tengan nodos aún */}
        {Object.entries(HUBS).map(([area, hub]) => (
          <circle key={area} cx={hub.x} cy={hub.y} r={4} fill="rgba(255,255,255,.35)" />
        ))}

        {/* Radios: cada nodo a su hub */}
        {nodos.map((n) => (
          <line
            key={`l-${n.id}`}
            x1={n.hub.x}
            y1={n.hub.y}
            x2={n.x}
            y2={n.y}
            stroke="rgba(255,255,255,.14)"
            strokeWidth={1}
          />
        ))}

        {/* Nodos */}
        <AnimatePresence>
          {nodos.map((n) => {
            const color = PERFILES[n.perfil]?.color ?? '#fff'
            const esNuevo = reciente === n.id
            return (
              <motion.g
                key={n.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={
                  esNuevo
                    ? { type: 'spring', stiffness: 260, damping: 16 }
                    : { duration: 0.5, ease: 'easeOut' }
                }
                style={{ transformOrigin: `${n.x}px ${n.y}px`, cursor: 'pointer' }}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover((h) => (h === n.id ? null : h))}
              >
                {esNuevo && (
                  <motion.circle
                    cx={n.x}
                    cy={n.y}
                    r={9}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    initial={{ r: 9, opacity: 0.9 }}
                    animate={{ r: 26, opacity: 0 }}
                    transition={{ duration: 1.1, ease: 'easeOut' }}
                  />
                )}
                <circle cx={n.x} cy={n.y} r={9} fill={color} />
                <circle cx={n.x} cy={n.y} r={9} fill="none" stroke="rgba(6,15,34,.5)" strokeWidth={1.5} />
              </motion.g>
            )
          })}
        </AnimatePresence>

        {/* Rótulos de área, al final: con un clúster grande la espiral de
            nodos llega hasta donde esté el texto, así que necesita su
            propio fondo y pintarse por encima de todo lo demás — perseguir
            un hueco vacío no sirve, porque deja de existir en cuanto entran
            más respuestas. */}
        {Object.entries(HUBS).map(([area, hub]) => {
          const abajo = Math.sin(hub.angle) >= 0
          const ly = hub.y + (abajo ? 26 : -18)
          const anchoAprox = hub.label.length * 8.4 + 24
          return (
            <g key={area}>
              <rect
                x={hub.x - anchoAprox / 2}
                y={ly - 11}
                width={anchoAprox}
                height={22}
                rx={11}
                fill="rgba(6,15,34,.78)"
              />
              <text
                x={hub.x}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white/85"
                style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.04em' }}
              >
                {hub.label}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Tooltip: pasivo, no hace falta para que /radar/pantalla funcione sola
          proyectada, pero ayuda a quien explore /radar/resultados con ratón */}
      {activo && (
        <div
          className="glass-2 pointer-events-none absolute z-10 max-w-[16rem] -translate-x-1/2 rounded-card px-4 py-3 text-left"
          style={{
            left: `${(activo.x / 1000) * 100}%`,
            top: `${(activo.y / 640) * 100}%`,
            transform: 'translate(-50%, -120%)',
          }}
        >
          <p
            className="text-[0.6875rem] font-bold uppercase tracking-[0.14em]"
            style={{ color: PERFILES[activo.perfil]?.color }}
          >
            {PERFILES[activo.perfil]?.corto}
          </p>
          <p className="mt-1 text-[0.9rem] font-semibold text-white">{etiquetaNodo(activo)}</p>
          <p className="mt-1 text-[0.8125rem] leading-snug text-white/75">{activo.necesidad_oferta}</p>
        </div>
      )}
    </div>
  )
}
