import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PERFILES, AREAS, areasDeFila, etiquetaNodo } from '../../data/radar.js'
import { calcularMatches } from './graphLayout.js'

const COLOR_MATCH = 'var(--color-mint)'
const CARD_W_MIN = 208
const CARD_W_MAX = 336
const CARD_H = 116
const HUECO = 28

/** El ancho de una tarjeta no es fijo: se ajusta al nombre que lleva
 *  dentro, entre un mínimo y un máximo legibles — así una organización con
 *  un nombre corto no arrastra el mismo hueco que una con uno largo, y el
 *  nombre no tiene por qué recortarse si cabe entero. */
function anchoTarjeta(fila) {
  const largo = etiquetaNodo(fila).length
  return Math.max(CARD_W_MIN, Math.min(CARD_W_MAX, largo * 8.2 + 84))
}

/** Hash de 32 bits de un string, para sembrar el generador de posiciones:
 *  determinista por id, así que una tarjeta no salta de sitio entre
 *  renders — solo cuando entra una respuesta nueva se recalcula todo. */
function hash32(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Generador pseudoaleatorio sembrado (mulberry32): mismo id, misma
 *  secuencia de posiciones probadas, siempre. */
function generador(semilla) {
  let a = semilla
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * El tamaño del lienzo (el "mapa") no depende de la ventana — depende de
 * cuántas respuestas hay. Con pocas, el mapa es pequeño; con muchas, crece.
 * Siempre a tamaño real de tarjeta, con hueco de sobra, así que colocarlas
 * sin que se pisen es un problema que sí tiene solución por construcción —
 * la ventana solo decide con cuánto zoom se ve ese mapa, nunca cuánto se
 * encoge una tarjeta.
 */
function calcularLienzo(filas, aspectoDeseado) {
  const n = filas.length
  if (n === 0) return { w: 1000, h: 640 }
  const areaTotal = filas.reduce((acc, f) => acc + (anchoTarjeta(f) + HUECO) * (CARD_H + HUECO), 0)
  const area = areaTotal * 2.3
  const w = Math.sqrt(area * aspectoDeseado)
  const h = area / w
  const anchoMax = Math.max(...filas.map(anchoTarjeta)) + HUECO
  return { w: Math.max(w, anchoMax), h: Math.max(h, CARD_H + HUECO) }
}

/**
 * Coloca cada tarjeta con una simulación de fuerzas, no con una retícula:
 * todas se repelen entre sí (para no pisarse), pero cada pareja que hace
 * match se atrae — así una empresa con varios retos alrededor suyo los
 * reúne cerca, formando un grupo que se distingue de un vistazo, mientras
 * que las que no tienen match ninguno quedan sueltas por el resto del
 * lienzo, sin ningún orden de lectura. Arranca desde posiciones sembradas
 * por id (deterministas) y deja que la física asiente el resultado.
 *
 * Después de asentar las fuerzas, una pasada de separación de rectángulos
 * empuja aparte cualquier par que aún se solape — el campo de fuerzas por
 * sí solo no lo garantiza matemáticamente, solo lo hace muy improbable. El
 * lienzo (`calcularLienzo`) ya viene dimensionado con sitio de sobra para
 * el número de tarjetas, así que esta pasada casi nunca tiene que trabajar.
 */
function colocarTarjetas(filas, pares, ancho, alto) {
  const n = filas.length
  if (n === 0) return {}
  const anchos = filas.map(anchoTarjeta)
  const idx = new Map(filas.map((f, i) => [f.id, i]))
  const cx = ancho / 2
  const cy = alto / 2

  const pos = filas.map((f, i) => {
    const rng = generador(hash32(f.id))
    return { x: rng() * Math.max(1, ancho - anchos[i]), y: rng() * Math.max(1, alto - CARD_H) }
  })
  const vel = pos.map(() => ({ x: 0, y: 0 }))
  const enlaces = pares
    .map(({ reto, solucion }) => [idx.get(reto), idx.get(solucion)])
    .filter(([a, b]) => a !== undefined && b !== undefined)

  const REPULSION = 34000
  const LONGITUD_ENLACE_BASE = 1.05
  const K_ENLACE = 0.028
  const AMORTIGUACION = 0.8
  // El empuje hacia el centro es más flojo en horizontal que en vertical
  // cuando el lienzo es ancho — si tira igual en los dos ejes, el grupo se
  // asienta en un óvalo que ignora ese ancho de sobra y dos tarjetas
  // pueden acabar más pegadas de lo que el hueco disponible pedía. Con un
  // empuje proporcional al aspecto del lienzo, el equilibrio del grupo
  // sigue esa misma forma ancha en vez de una redonda.
  const aspecto = ancho / alto
  const K_CENTRO_BASE = 0.0012
  const K_CENTRO_X = K_CENTRO_BASE / Math.max(1, aspecto)
  const K_CENTRO_Y = K_CENTRO_BASE * Math.max(1, aspecto)

  for (let iter = 0; iter < 240; iter++) {
    const fuerza = pos.map(() => ({ x: 0, y: 0 }))

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pos[i].x - pos[j].x
        const dy = pos[i].y - pos[j].y
        const distSq = Math.max(400, dx * dx + dy * dy)
        const dist = Math.sqrt(distSq)
        const f = REPULSION / distSq
        const fx = (dx / dist) * f
        const fy = (dy / dist) * f
        fuerza[i].x += fx
        fuerza[i].y += fy
        fuerza[j].x -= fx
        fuerza[j].y -= fy
      }
    }

    for (const [a, b] of enlaces) {
      const dx = pos[b].x - pos[a].x
      const dy = pos[b].y - pos[a].y
      const dist = Math.hypot(dx, dy) || 1
      const longitudEnlace = ((anchos[a] + anchos[b]) / 2) * LONGITUD_ENLACE_BASE
      const f = (dist - longitudEnlace) * K_ENLACE
      const fx = (dx / dist) * f
      const fy = (dy / dist) * f
      fuerza[a].x += fx
      fuerza[a].y += fy
      fuerza[b].x -= fx
      fuerza[b].y -= fy
    }

    for (let i = 0; i < n; i++) {
      fuerza[i].x += (cx - pos[i].x) * K_CENTRO_X
      fuerza[i].y += (cy - pos[i].y) * K_CENTRO_Y
      vel[i].x = (vel[i].x + fuerza[i].x) * AMORTIGUACION
      vel[i].y = (vel[i].y + fuerza[i].y) * AMORTIGUACION
      pos[i].x = Math.max(0, Math.min(ancho - anchos[i], pos[i].x + vel[i].x))
      pos[i].y = Math.max(0, Math.min(alto - CARD_H, pos[i].y + vel[i].y))
    }
  }

  for (let pasada = 0; pasada < 300; pasada++) {
    let huboSolape = false
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const solapeX = Math.min(pos[i].x + anchos[i], pos[j].x + anchos[j]) - Math.max(pos[i].x, pos[j].x)
        const solapeY = Math.min(pos[i].y + CARD_H, pos[j].y + CARD_H) - Math.max(pos[i].y, pos[j].y)
        if (solapeX > -HUECO && solapeY > -HUECO) {
          huboSolape = true
          const empujeX = (solapeX + HUECO) / 2
          const empujeY = (solapeY + HUECO) / 2
          // El signo se decide por índice (i, j), no por su posición actual:
          // decidirlo por posición puede quedar en tablas cuando dos
          // tarjetas caen casi exactamente encima la una de la otra — al
          // estar empatadas, cada pasada invierte el sentido del empujón y
          // no llegan a separarse nunca (rebotan en el sitio).
          if (empujeX < empujeY) {
            const signo = i < j ? 1 : -1
            pos[i].x -= empujeX * signo
            pos[j].x += empujeX * signo
          } else {
            const signoY = i < j ? 1 : -1
            pos[i].y -= empujeY * signoY
            pos[j].y += empujeY * signoY
          }
          pos[i].x = Math.max(0, Math.min(ancho - anchos[i], pos[i].x))
          pos[i].y = Math.max(0, Math.min(alto - CARD_H, pos[i].y))
          pos[j].x = Math.max(0, Math.min(ancho - anchos[j], pos[j].x))
          pos[j].y = Math.max(0, Math.min(alto - CARD_H, pos[j].y))
        }
      }
    }
    if (!huboSolape) break
  }

  const posiciones = {}
  filas.forEach((f, i) => {
    posiciones[f.id] = pos[i]
  })
  return posiciones
}

/** Hash → [0,1) estable, para la curvatura de un hilo o el desvío de
 *  rotación de una tarjeta. */
function pseudoAleatorio(id) {
  return hash32(id) / 4294967296
}

/**
 * El centro de cada tarjeta, en coordenadas del lienzo — se calcula
 * directamente de `posiciones` y `anchoTarjeta`, nunca midiendo el DOM ya
 * pintado. Medirlo (`getBoundingClientRect`) obligaba a deshacer a mano el
 * zoom y el paneo del mapa para volver a coordenadas del lienzo, y ese
 * cálculo se desincronizaba en cuanto el usuario tocaba la rueda o
 * arrastraba antes de que la medición llegara a correr — los hilos
 * terminaban en cualquier punto menos en sus tarjetas. Con la posición y
 * el ancho ya conocidos de antemano, el centro es aritmética directa, sin
 * depender de cuándo ni con qué zoom se pinte.
 */
function centroTarjeta(fila, posiciones) {
  const p = posiciones[fila.id]
  if (!p) return null
  return { x: p.x + anchoTarjeta(fila) / 2, y: p.y + CARD_H / 2 }
}

/** Un hilo entre una tarjeta-reto y una tarjeta-solución que hacen match:
 *  una curva suave con un punto de luz que la recorre de un lado a otro —
 *  lo que hace que el Radar se lea como un radar. Las coordenadas son del
 *  lienzo (no de la pantalla): el zoom y el paneo del mapa las mueven a
 *  todas juntas, como una capa más. */
function Hilo({ id, x1, y1, x2, y2, activo = false, atenuado = false }) {
  const t = pseudoAleatorio(id)
  const duracion = 3 + t * 2.4
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const dist = Math.hypot(dx, dy) || 1
  const curvatura = Math.min(dist * 0.16, 46) * (t > 0.5 ? 1 : -1)
  const cx = mx + (-dy / dist) * curvatura
  const cy = my + (dx / dist) * curvatura
  const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`

  const pasos = 10
  const puntos = Array.from({ length: pasos + 1 }, (_, i) => {
    const s = i / pasos
    const u = 1 - s
    return {
      x: u * u * x1 + 2 * u * s * cx + s * s * x2,
      y: u * u * y1 + 2 * u * s * cy + s * s * y2,
    }
  })

  return (
    <g opacity={atenuado ? 0.15 : 1}>
      <path
        d={d}
        fill="none"
        stroke={COLOR_MATCH}
        strokeOpacity={activo ? 0.85 : 0.4}
        strokeWidth={activo ? 2.5 : 1.5}
        style={activo ? { filter: `drop-shadow(0 0 6px ${COLOR_MATCH})` } : undefined}
      />
      <motion.circle
        r={activo ? 4 : 3}
        fill={COLOR_MATCH}
        style={{ color: COLOR_MATCH, filter: `drop-shadow(0 0 ${activo ? 8 : 5}px currentColor)` }}
        initial={{ cx: x1, cy: y1, opacity: 0 }}
        animate={{ cx: puntos.map((p) => p.x), cy: puntos.map((p) => p.y), opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0] }}
        transition={{ duration: duracion, delay: t * duracion, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
      />
    </g>
  )
}

const CICLO_PARPADEO = 5

/** El parpadeo de una tarjeta con match: el marco se enciende y se apaga
 *  cada `CICLO_PARPADEO` segundos — no todas a la vez, cada una arranca en
 *  un momento propio (por hash de su id), así que se leen como respuestas
 *  independientes parpadeando por su cuenta, no como una sola cosa. */
function Parpadeo({ id }) {
  const retraso = pseudoAleatorio(id) * CICLO_PARPADEO

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 rounded-2xl"
      style={{ boxShadow: `0 0 0 2px ${COLOR_MATCH}, 0 0 8px 1px ${COLOR_MATCH}` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{
        duration: CICLO_PARPADEO,
        delay: retraso,
        times: [0, 0.12, 0.3],
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  )
}

/** Una tarjeta suelta: nombre y el reto o la solución que trajo, siempre
 *  visibles — nunca hace falta pasar el ratón por encima para leerlos. Un
 *  giro mínimo y estable (por hash del id) evita que se vean todas en la
 *  misma orientación, como notas repartidas sobre una mesa. Las que hacen
 *  match tienen el marco parpadeando cada pocos segundos, cada una en su
 *  propio momento. Siempre a tamaño real — es el mapa el que hace zoom, no
 *  la tarjeta la que se encoge — pero su ancho sí se ajusta al nombre que
 *  lleva dentro (ver `anchoTarjeta`), así que una organización con un
 *  nombre largo se ensancha en vez de recortarlo.
 *
 *  Al hacer clic entra en foco (`onFoco`): el resto del mapa se atenúa y
 *  desenfoca, esta tarjeta y con la(s) que conecta se quedan nítidas por
 *  encima de ese velo, y se abre un panel centrado con el detalle
 *  completo — ver `PanelFoco`. */
function Tarjeta({ fila, pos, ancho, esNueva, tieneMatch, atenuada, activa, onFoco }) {
  const [hover, setHover] = useState(false)
  const color = PERFILES[fila.perfil]?.color ?? '#fff'
  const giro = (pseudoAleatorio(fila.id) - 0.5) * 5

  return (
    <motion.div
      initial={esNueva ? { opacity: 0, scale: 0, left: pos.x, top: pos.y, rotate: giro } : false}
      animate={{ opacity: atenuada ? 0.22 : 1, scale: 1, left: pos.x, top: pos.y, rotate: giro }}
      transition={
        esNueva
          ? { type: 'spring', stiffness: 220, damping: 20 }
          : { type: 'spring', stiffness: 200, damping: 26 }
      }
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onFoco(fila.id)}
      className="absolute cursor-pointer select-none rounded-2xl px-3.5 py-3"
      style={{
        width: ancho,
        transformOrigin: 'top left',
        background: hover ? 'rgba(17,26,46,.96)' : 'rgba(13,20,38,.92)',
        border: `1px solid ${activa ? color : 'rgba(255,255,255,.12)'}`,
        boxShadow: esNueva
          ? `0 0 0 3px ${color}55, 0 0 18px ${color}55`
          : activa
            ? `0 0 0 2px ${color}66, 0 8px 22px rgba(0,0,0,.4)`
            : '0 6px 18px rgba(0,0,0,.35)',
        filter: atenuada ? 'blur(2.5px)' : 'none',
        // Todas las tarjetas van por encima del velo (zIndex 15) aunque
        // estén atenuadas — si no, el velo se queda tapando el clic y el
        // hover de cualquier tarjeta que no sea la activa, y en foco solo
        // se podría interactuar con la tarjeta ya enfocada.
        zIndex: activa ? 30 : hover ? 20 : 16,
      }}
    >
      {tieneMatch && <Parpadeo id={fila.id} />}

      <div className="flex items-start gap-2">
        <span
          className="mt-[4px] h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}` }}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.9375rem] font-bold leading-tight text-white">
            {etiquetaNodo(fila)}
          </p>
          <p className="mt-1 text-[0.8125rem] leading-snug text-white/70 line-clamp-2">
            {fila.necesidad_oferta}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

/** Una versión pequeña de la tarjeta del mapa, para el panel de foco: el
 *  mismo lenguaje visual (punto de color, nombre, texto), a menor tamaño,
 *  para que el par se lea como "la misma tarjeta del mapa, solo que más
 *  cerca" y no como una lista de texto aparte. */
function TarjetaMini({ fila, principal, onClick }) {
  const color = PERFILES[fila.perfil]?.color ?? '#fff'
  const Contenedor = onClick ? 'button' : 'div'

  return (
    <Contenedor
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-56 shrink-0 rounded-2xl px-3.5 py-3 text-left ${onClick ? 'press transition-[filter] hover:brightness-125' : ''}`}
      style={{
        // Fondos distintos a propósito — el de la izquierda tintado con el
        // color del propio perfil, el de la derecha con el menta del hilo
        // — así las dos tarjetas se distinguen de un vistazo, no solo por
        // el borde.
        background: principal
          ? `color-mix(in srgb, ${color} 18%, rgba(13,20,38,.97))`
          : `color-mix(in srgb, ${COLOR_MATCH} 16%, rgba(13,20,38,.97))`,
        border: `1px solid ${principal ? color : `${COLOR_MATCH}55`}`,
        boxShadow: principal ? `0 0 0 2px ${color}55, 0 8px 20px rgba(0,0,0,.4)` : '0 6px 16px rgba(0,0,0,.35)',
      }}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-[4px] h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}` }}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.875rem] font-bold leading-tight text-white">{etiquetaNodo(fila)}</p>
          <p className="mt-1 text-[0.75rem] leading-snug text-white/70 line-clamp-2">{fila.necesidad_oferta}</p>
        </div>
      </div>
    </Contenedor>
  )
}

/** El panel de foco: la tarjeta en la que se ha hecho clic — y si hace
 *  match, la organización con la que conecta, tal cual se ven las dos en
 *  el mapa: una a la izquierda, otra a la derecha, unidas por el mismo
 *  hilo con su punto de luz. Es el mapa acercándose a un solo par, no una
 *  lista de texto aparte — por eso reutiliza `TarjetaMini` y `Hilo` en vez
 *  de inventar una vista nueva. Con más de un match, los de la derecha se
 *  apilan y cada uno recibe su propio hilo desde la tarjeta principal.
 *  Las coordenadas del hilo aquí sí se miden del DOM (`getBoundingClientRect`)
 *  — a diferencia del mapa grande, este panel no hace pan ni zoom, así que
 *  no hay nada que lo desincronice. */
function PanelFoco({ fila, relacionadas, onCerrar, onFoco }) {
  const color = PERFILES[fila.perfil]?.color ?? '#fff'
  const areas = areasDeFila(fila)

  const contenedorRef = useRef(null)
  const izqRef = useRef(null)
  const derRefs = useRef([])
  const [hilos, setHilos] = useState([])

  // Mide dónde caen los bordes de las dos tarjetas para dibujar el hilo
  // entre ellas. No basta con medir una vez al montar: el panel entra con
  // una animación de escala (`initial={{ scale: 0.92 }}` más abajo), y
  // `useLayoutEffect` mide justo al montar, antes de que esa animación
  // termine — con las tarjetas todavía más juntas de lo que acaban quedando.
  // El hilo se dibujaba corto, sin llegar a la tarjeta de la derecha.
  // Por eso se mide dos veces: al montar (para que haya algo dibujado desde
  // el primer fotograma) y otra vez cuando la animación de entrada termina
  // (`onAnimationComplete` del `motion.div`, más abajo), ya con el tamaño
  // final.
  const medir = () => {
    if (relacionadas.length === 0) {
      setHilos([])
      return
    }
    const base = contenedorRef.current?.getBoundingClientRect()
    const izq = izqRef.current?.getBoundingClientRect()
    if (!base || !izq) return
    const x1 = izq.right - base.left
    const y1 = izq.top + izq.height / 2 - base.top
    const nuevos = relacionadas
      .map((r, i) => {
        const der = derRefs.current[i]?.getBoundingClientRect()
        if (!der) return null
        return {
          id: `panel-${fila.id}-${r.id}`,
          x1,
          y1,
          x2: der.left - base.left,
          y2: der.top + der.height / 2 - base.top,
        }
      })
      .filter(Boolean)
    setHilos(nuevos)
  }

  useLayoutEffect(() => {
    derRefs.current = derRefs.current.slice(0, relacionadas.length)
    medir()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fila.id, relacionadas])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: 8 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      onAnimationComplete={medir}
      className={`pointer-events-auto max-w-[92vw] rounded-3xl p-6 text-left shadow-2xl ${
        relacionadas.length > 0 ? 'w-[38rem]' : 'w-[26rem]'
      }`}
      style={{ background: 'rgba(9,16,32,.98)', border: `1px solid ${color}66` }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            aria-hidden="true"
          />
          <div>
            <p className="text-[1.25rem] font-extrabold leading-tight text-white">{etiquetaNodo(fila)}</p>
            <p className="mt-1 text-[0.75rem] font-bold uppercase tracking-[0.1em]" style={{ color }}>
              {PERFILES[fila.perfil]?.corto} · {areas.map((a) => AREAS[a]).join(', ')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="press grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
        >
          ✕
        </button>
      </div>

      <p className="mt-4 whitespace-normal text-[0.9375rem] leading-relaxed text-white/90">
        {fila.necesidad_oferta}
      </p>

      {relacionadas.length > 0 && (
        <div className="mt-5 border-t border-white/10 pt-5">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em]" style={{ color: COLOR_MATCH }}>
            Conecta con
          </p>
          <div
            ref={contenedorRef}
            className="relative mt-4 flex max-h-[22rem] items-stretch justify-between gap-8 overflow-hidden"
          >
            {/* El hilo va en un hermano fuera de la columna que hace
                scroll (no dentro): así, si una tarjeta relacionada se
                desplaza fuera de la vista, el propio `overflow-hidden` de
                aquí (misma altura que el scroll de la columna) recorta el
                hilo justo en el mismo borde en vez de dejarlo flotando
                fuera del panel. */}
            <svg className="pointer-events-none absolute inset-0" style={{ overflow: 'visible' }}>
              {hilos.map((h) => (
                <Hilo key={h.id} {...h} activo />
              ))}
            </svg>
            <div ref={izqRef} className="relative z-10 self-center">
              <TarjetaMini fila={fila} principal />
            </div>
            {/* Con muchos matches (Nova llega a tener 7) la lista no cabe
                entera — hace scroll ella sola en vez de desbordar el panel.
                Cada scroll vuelve a medir (`medir`) para que el hilo no se
                quede apuntando a donde estaba la tarjeta antes de moverse. */}
            <div
              onScroll={medir}
              className="relative z-10 flex max-h-[22rem] flex-col gap-3 overflow-y-auto pr-1"
            >
              {relacionadas.map((r, i) => (
                <div key={r.id} ref={(el) => (derRefs.current[i] = el)}>
                  <TarjetaMini fila={r} onClick={() => onFoco(r.id)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

const ZOOM_MIN_REL = 0.6
const ZOOM_MAX_REL = 3

/**
 * El Radar en sí: un mapa (un lienzo del tamaño que hagan falta las
 * respuestas que hay, nunca del tamaño de la ventana) sobre el que las
 * tarjetas se colocan sueltas, sin agruparlas por área ni alinearlas en
 * cuadrícula — cada una por una simulación de fuerzas (`colocarTarjetas`):
 * se repelen entre sí, pero cada pareja que hace match se atrae, así que
 * un grupo conectado se distingue de un vistazo y las sueltas quedan
 * repartidas sin orden por el resto del lienzo.
 *
 * La ventana (el hueco visible dentro del panel) enseña ese mapa con zoom
 * ajustado para que quepa entero al abrir — como Figma o Canva, no como una
 * pantalla que reparte tarjetas ella misma. Con la rueda del ratón se
 * acerca o aleja, y arrastrando se pasea por él; nunca hace falta encoger
 * una tarjeta para que quepan más, porque el mapa ya nació con sitio de
 * sobra para todas.
 *
 * Encima, en un SVG superpuesto, un hilo con un punto de luz conecta cada
 * Administración con reto en un área y cada Empresa/Startup/Universidad con
 * solución en esa misma área — el "match" del Radar. Sin match, la tarjeta
 * se queda sola. Las coordenadas de los hilos se miden de verdad sobre el
 * DOM ya colocado, así que siguen a sus tarjetas sea cual sea el zoom.
 */
export default function RadarGraph({ filas, reciente, llenarAltura = false }) {
  const { pares, emparejadas } = useMemo(() => calcularMatches(filas), [filas])

  const viewportRef = useRef(null)
  const arrastreRef = useRef(null)
  const [viewport, setViewport] = useState({ w: 0, h: 0 })
  const [vista, setVista] = useState(null) // { zoom, x, y }
  const [foco, setFoco] = useState(null)

  // Con qué otras tarjetas conecta cada una — para saber, al hacer foco en
  // una, cuáles más se quedan nítidas y cuáles se listan en el panel.
  const relacionadosPorId = useMemo(() => {
    const mapa = new Map()
    const agregar = (a, b) => {
      if (!mapa.has(a)) mapa.set(a, new Set())
      mapa.get(a).add(b)
    }
    for (const { reto, solucion } of pares) {
      agregar(reto, solucion)
      agregar(solucion, reto)
    }
    return mapa
  }, [pares])

  const activos = useMemo(() => {
    if (!foco) return null
    return new Set([foco, ...(relacionadosPorId.get(foco) ?? [])])
  }, [foco, relacionadosPorId])

  const filaFoco = foco ? (filas.find((f) => f.id === foco) ?? null) : null

  // Si la tarjeta enfocada desaparece (p. ej. se borra en Supabase mientras
  // la pantalla sigue abierta), `foco` no se limpia solo — sin esto, el
  // velo se quedaría oscureciendo todo para siempre sin ninguna tarjeta
  // activa y sin panel que ofrezca cerrarlo.
  useEffect(() => {
    if (foco && !filaFoco) setFoco(null)
  }, [foco, filaFoco])
  const filasRelacionadas = filaFoco
    ? [...(relacionadosPorId.get(foco) ?? [])].map((id) => filas.find((f) => f.id === id)).filter(Boolean)
    : []

  const lienzo = useMemo(
    () => calcularLienzo(filas, viewport.w > 0 ? viewport.w / viewport.h : 1.6),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filas, viewport.w, viewport.h],
  )

  const posiciones = useMemo(
    () => colocarTarjetas(filas, pares, lienzo.w, lienzo.h),
    [filas, pares, lienzo.w, lienzo.h],
  )

  const lineas = useMemo(() => {
    const porId = new Map(filas.map((f) => [f.id, f]))
    const resultado = []
    for (const { reto, solucion } of pares) {
      const filaA = porId.get(reto)
      const filaB = porId.get(solucion)
      if (!filaA || !filaB) continue
      const a = centroTarjeta(filaA, posiciones)
      const b = centroTarjeta(filaB, posiciones)
      if (!a || !b) continue
      resultado.push({ id: `${reto}-${solucion}`, reto, solucion, x1: a.x, y1: a.y, x2: b.x, y2: b.y })
    }
    return resultado
  }, [filas, pares, posiciones])

  // El rectángulo que de verdad ocupan las tarjetas — no el lienzo entero,
  // que se dimensiona generoso a propósito para que la simulación de
  // fuerzas tenga margen de sobra. La física, con el empuje hacia el
  // centro, tiende a agrupar las tarjetas en un óvalo más pequeño que el
  // lienzo; encuadrar el lienzo entero dejaba ese óvalo encogido en medio
  // de la pantalla, con los lados vacíos aunque hubiera hueco de sobra.
  // Encuadrando el contenido real, el mapa aprovecha todo el ancho (y
  // alto) disponible que las propias tarjetas ocupan.
  const contenido = useMemo(() => {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const fila of filas) {
      const p = posiciones[fila.id]
      if (!p) continue
      minX = Math.min(minX, p.x)
      minY = Math.min(minY, p.y)
      maxX = Math.max(maxX, p.x + anchoTarjeta(fila))
      maxY = Math.max(maxY, p.y + CARD_H)
    }
    if (!Number.isFinite(minX)) return { x: 0, y: 0, w: lienzo.w, h: lienzo.h }
    const margen = 48
    return {
      x: minX - margen,
      y: minY - margen,
      w: maxX - minX + margen * 2,
      h: maxY - minY + margen * 2,
    }
  }, [filas, posiciones, lienzo.w, lienzo.h])

  // Mide el hueco visible de verdad (el panel que contiene el mapa).
  useLayoutEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    const medir = () => {
      const r = vp.getBoundingClientRect()
      setViewport((prev) => (Math.abs(prev.w - r.width) > 1 || Math.abs(prev.h - r.height) > 1 ? { w: r.width, h: r.height } : prev))
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(vp)
    return () => observador.disconnect()
  }, [])

  // El zoom de partida: que el contenido (las tarjetas, no el lienzo
  // entero) quepa en el hueco visible, con un margen. Se recalcula si
  // cambia el tamaño de la ventana o cuántas tarjetas hay — no si el
  // usuario solo se ha movido por el mapa (eso lo guarda su propio estado,
  // `vista`, sin que este efecto lo pise).
  const zoomAjuste = useMemo(() => {
    if (viewport.w === 0 || contenido.w === 0) return 1
    return Math.min(viewport.w / contenido.w, viewport.h / contenido.h) * 0.985
  }, [viewport.w, viewport.h, contenido.w, contenido.h])

  useLayoutEffect(() => {
    if (zoomAjuste === 1 && viewport.w === 0) return
    setVista({
      zoom: zoomAjuste,
      x: (viewport.w - contenido.w * zoomAjuste) / 2 - contenido.x * zoomAjuste,
      y: (viewport.h - contenido.h * zoomAjuste) / 2 - contenido.y * zoomAjuste,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomAjuste, contenido.x, contenido.y, contenido.w, contenido.h])

  const limitar = (siguiente) => {
    const zoom = Math.max(zoomAjuste * ZOOM_MIN_REL, Math.min(zoomAjuste * ZOOM_MAX_REL, siguiente.zoom))
    return { ...siguiente, zoom }
  }

  // La rueda del ratón necesita `preventDefault` para acercar el mapa en
  // vez de desplazar la página — y React trata `onWheel` como pasivo, así
  // que ahí `preventDefault` no hace nada y el navegador lo avisa por
  // consola. Un listener nativo con `{ passive: false }` sí puede
  // bloquearlo de verdad. Se engancha una sola vez; lee `vista` y
  // `zoomAjuste` de una ref para no quedarse con valores viejos.
  const estadoRef = useRef({ vista, zoomAjuste })
  estadoRef.current = { vista, zoomAjuste }

  useLayoutEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    const alRodar = (e) => {
      const { vista, zoomAjuste } = estadoRef.current
      if (!vista) return
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
      const vpRect = vp.getBoundingClientRect()
      const px = e.clientX - vpRect.left
      const py = e.clientY - vpRect.top
      const nuevoZoom = Math.max(zoomAjuste * ZOOM_MIN_REL, Math.min(zoomAjuste * ZOOM_MAX_REL, vista.zoom * factor))
      const razon = nuevoZoom / vista.zoom
      setVista({
        zoom: nuevoZoom,
        x: px - (px - vista.x) * razon,
        y: py - (py - vista.y) * razon,
      })
    }
    vp.addEventListener('wheel', alRodar, { passive: false })
    return () => vp.removeEventListener('wheel', alRodar)
  }, [])

  const alBajarRaton = (e) => {
    arrastreRef.current = { x: e.clientX, y: e.clientY, vx: vista.x, vy: vista.y }
  }
  const alMoverRaton = (e) => {
    if (!arrastreRef.current) return
    const dx = e.clientX - arrastreRef.current.x
    const dy = e.clientY - arrastreRef.current.y
    setVista((v) => limitar({ ...v, x: arrastreRef.current.vx + dx, y: arrastreRef.current.vy + dy }))
  }
  const alSoltarRaton = () => {
    arrastreRef.current = null
  }

  const reencuadrar = () => {
    setVista({
      zoom: zoomAjuste,
      x: (viewport.w - contenido.w * zoomAjuste) / 2 - contenido.x * zoomAjuste,
      y: (viewport.h - contenido.h * zoomAjuste) / 2 - contenido.y * zoomAjuste,
    })
  }

  // Los botones +/- hacen zoom centrado en el medio del hueco visible, no
  // en un punto del ratón — igual que la rueda, pero sin necesitar saber
  // dónde está el cursor.
  const zoomBoton = (factor) => {
    setVista((v) => {
      const px = viewport.w / 2
      const py = viewport.h / 2
      const nuevoZoom = Math.max(zoomAjuste * ZOOM_MIN_REL, Math.min(zoomAjuste * ZOOM_MAX_REL, v.zoom * factor))
      const razon = nuevoZoom / v.zoom
      return { zoom: nuevoZoom, x: px - (px - v.x) * razon, y: py - (py - v.y) * razon }
    })
  }

  return (
    <div
      ref={viewportRef}
      className={`relative overflow-hidden ${llenarAltura ? 'h-full' : 'aspect-[16/10]'}`}
      style={{ cursor: arrastreRef.current ? 'grabbing' : 'grab' }}
      onMouseDown={alBajarRaton}
      onMouseMove={alMoverRaton}
      onMouseUp={alSoltarRaton}
      onMouseLeave={alSoltarRaton}
    >
      {/* El oscurecido de foco es UNA sola capa: un portal a
          `document.body` que tapa TODA la página (título, contadores,
          leyenda incluidos) — si solo se oscurece el mapa, el resto de la
          pantalla se queda encendido y el efecto se nota a medias. El
          panel del mapa (`RadarPantalla`/`RadarResultados`) lleva su
          propio z-index por encima de este velo, así que sus tarjetas y el
          hilo activo no se ven afectadas por él — cada una gestiona su
          propio brillo u opacidad por separado. Se probó además un segundo
          velo oscuro dentro del propio lienzo (del tamaño del mapa, mucho
          más grande que lo que se ve en pantalla): quedaba como un
          rectángulo de borde recto encima del desenfoque general, dos
          oscurecidos distintos en vez de uno solo — se quitó y solo queda
          el botón invisible para cerrar al pulsar el mapa vacío, más
          abajo. */}
      {foco &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0"
            style={{ background: 'rgba(4,9,20,.6)', backdropFilter: 'blur(4px)', zIndex: 9 }}
            onClick={() => setFoco(null)}
            aria-hidden="true"
          />,
          document.body,
        )}

      {filas.length === 0 && (
        <p className="py-2 text-[0.875rem] italic text-white/40">Esperando la primera respuesta…</p>
      )}

      {vista && (
        <div
          className="absolute left-0 top-0"
          style={{
            width: lienzo.w,
            height: lienzo.h,
            transform: `translate(${vista.x}px, ${vista.y}px) scale(${vista.zoom})`,
            transformOrigin: 'top left',
          }}
        >
          <svg
            width={lienzo.w}
            height={lienzo.h}
            className="pointer-events-none absolute left-0 top-0"
            style={{ overflow: 'visible' }}
          >
            {lineas.map((l) => (
              <Hilo key={l.id} {...l} atenuado={Boolean(foco)} />
            ))}
          </svg>

          {/* Un botón invisible del tamaño del lienzo, solo para poder
              cerrar el foco al pulsar sobre el mapa vacío — el oscurecido
              en sí ya lo pone el velo de página completa (más abajo, por
              `document.body`). Un segundo velo aquí, del tamaño del
              lienzo (mucho más generoso que lo que se ve en pantalla),
              dibujaba un rectángulo oscuro con borde recto encima del
              desenfoque general de la página — dos oscurecidos distintos
              en vez de uno solo. */}
          {foco && (
            <div
              className="absolute left-0 top-0"
              style={{ width: lienzo.w, height: lienzo.h, zIndex: 15 }}
              onClick={() => setFoco(null)}
            />
          )}

          {foco && (
            <svg
              width={lienzo.w}
              height={lienzo.h}
              className="pointer-events-none absolute left-0 top-0"
              style={{ overflow: 'visible', zIndex: 25 }}
            >
              {lineas
                .filter((l) => l.reto === foco || l.solucion === foco)
                .map((l) => (
                  <Hilo key={l.id} {...l} activo />
                ))}
            </svg>
          )}

          {filas.map((fila) => {
            const pos = posiciones[fila.id]
            if (!pos) return null
            return (
              <Tarjeta
                key={fila.id}
                fila={fila}
                pos={pos}
                ancho={anchoTarjeta(fila)}
                esNueva={reciente === fila.id}
                tieneMatch={emparejadas.has(fila.id)}
                activa={Boolean(activos) && activos.has(fila.id)}
                atenuada={Boolean(activos) && !activos.has(fila.id)}
                onFoco={setFoco}
              />
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {filaFoco && (
          <div className="pointer-events-none absolute inset-0 z-50 grid place-items-center p-6">
            <PanelFoco
              fila={filaFoco}
              relacionadas={filasRelacionadas}
              onCerrar={() => setFoco(null)}
              onFoco={setFoco}
            />
          </div>
        )}
      </AnimatePresence>

      {vista && (
        <div className="absolute bottom-3 right-3 z-40 flex items-center gap-2">
          {Math.abs(vista.zoom - zoomAjuste) > 0.01 && (
            <button
              type="button"
              onClick={reencuadrar}
              className="press glass-2 rounded-full px-3.5 py-2 text-[0.75rem] font-bold text-white"
            >
              Ver todo
            </button>
          )}
          <div className="glass-2 flex items-center overflow-hidden rounded-full">
            <button
              type="button"
              onClick={() => zoomBoton(1 / 1.3)}
              aria-label="Alejar"
              className="press flex h-9 w-9 items-center justify-center text-[1.1rem] font-bold text-white hover:bg-white/10"
            >
              −
            </button>
            <span className="h-5 w-px bg-white/15" aria-hidden="true" />
            <button
              type="button"
              onClick={() => zoomBoton(1.3)}
              aria-label="Acercar"
              className="press flex h-9 w-9 items-center justify-center text-[1.1rem] font-bold text-white hover:bg-white/10"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
