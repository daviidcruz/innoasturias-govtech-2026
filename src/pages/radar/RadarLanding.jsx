import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Backdrop from '../../components/Backdrop.jsx'
import { supabase } from '../../lib/supabase.js'
import { evento, cuadrantes } from '../../data/content.js'
import { PERFILES, ORDEN_PERFILES, etiquetaNodo } from '../../data/radar.js'
import RadarGraph from './RadarGraph.jsx'
import { useMatches, useVistos } from './useRadarEstado.js'
import { calcularStats } from './radarStats.js'

/** Quita tildes y pasa a minúsculas — para que buscar "innovacion" encuentre
 *  "Innovación" sin que el acento tenga que coincidir tecleado. */
function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * /radar — landing propia del Radar, pensada para compartir aparte del
 * sitio del evento: explica qué es, deja participar (link al formulario de
 * /radar/participar) y muestra el mapa en directo, todo en una sola
 * página. No es la pantalla de proyección (/radar/pantalla, pensada para
 * pantalla completa en sala) ni los resultados finales (/radar/resultados,
 * congelada tras el evento) — esta vive mientras el Radar está abierto a
 * respuestas.
 */
export default function RadarLanding() {
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)
  const [reciente, setReciente] = useState(null)
  const yaCargoRef = useRef(false)
  const graphRef = useRef(null)

  // Los matches y lo ya comentado también hacen falta aquí (no solo dentro
  // de RadarGraph): el carrusel de pendientes necesita saber cuáles quedan
  // sin comentar para poder ir pasando de uno a otro con flechas.
  const matches = useMatches()
  const { vistos } = useVistos()

  const [modoPendientes, setModoPendientes] = useState(false)
  // La tarjeta enfocada ahora mismo, la abra quien la abra — un clic
  // directo en el mapa, el buscador o el carrusel de pendientes. La avisa
  // `RadarGraph` (prop `onFocoCambia`).
  const [idEnfocado, setIdEnfocado] = useState(null)

  // Solo los matches donde AL MENOS uno de los dos lados sigue sin
  // comentar — en cuanto se hace foco en un par, las dos tarjetas quedan
  // marcadas como vistas y el par desaparece de esta lista.
  const pendientes = useMemo(
    () =>
      matches
        .filter((m) => !vistos.has(m.reto_id) || !vistos.has(m.solucion_id))
        .sort((a, b) => new Date(a.creado_en) - new Date(b.creado_en)),
    [matches, vistos],
  )

  // Qué lista recorren las flechas: siempre de relación en relación, nunca
  // nodo a nodo — pasar de un lado de una pareja al otro no tiene sentido
  // (es la misma relación, ya se ve entera en el panel), y una tarjeta
  // suelta sin match tampoco interesa presentarla en el recorrido
  // automático. En modo pendientes, solo las que aún no se han comentado;
  // si no, todas.
  const paresNavegables = useMemo(() => {
    const base = modoPendientes ? pendientes : matches
    return [...base].sort((a, b) => new Date(a.creado_en) - new Date(b.creado_en))
  }, [modoPendientes, pendientes, matches])

  // La posición actual dentro de esa lista — se busca por CUALQUIERA de
  // los dos lados de la pareja (reto o solución).
  const posicionActual = paresNavegables.findIndex(
    (p) => p.reto_id === idEnfocado || p.solucion_id === idEnfocado,
  )

  const irA = (delta) => {
    const total = paresNavegables.length
    if (total === 0) return
    const base = posicionActual === -1 ? -1 : posicionActual
    const siguiente = paresNavegables[((base + delta) % total + total) % total]
    graphRef.current?.enfocar(siguiente.reto_id)
  }

  const cerrarFoco = () => {
    graphRef.current?.cerrar()
    setModoPendientes(false)
  }

  const alternarPendientes = () => {
    if (modoPendientes) {
      cerrarFoco()
      return
    }
    setModoPendientes(true)
    if (pendientes.length > 0) graphRef.current?.enfocar(pendientes[0].reto_id)
  }

  // Con un mando/clicker de presentación (que suele enviar las flechas del
  // teclado) se puede pasar de tarjeta sin tener que apuntar con el ratón.
  useEffect(() => {
    if (!idEnfocado) return
    const alTeclado = (e) => {
      if (e.key === 'ArrowRight') irA(1)
      else if (e.key === 'ArrowLeft') irA(-1)
      else if (e.key === 'Escape') cerrarFoco()
    }
    window.addEventListener('keydown', alTeclado)
    return () => window.removeEventListener('keydown', alTeclado)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idEnfocado, paresNavegables])

  // Buscador por institución/organización (o por perfil) — para cuando
  // alguien dice que no ha visto la suya: se teclea el nombre y se enfoca
  // directamente, sin tener que rastrear el mapa a ojo.
  const [mostrarBuscador, setMostrarBuscador] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  const resultadosBusqueda = useMemo(() => {
    const q = normalizar(busqueda.trim())
    if (!q) return []
    return filas
      .filter((f) => normalizar(etiquetaNodo(f)).includes(q) || normalizar(f.necesidad_oferta).includes(q))
      .slice(0, 8)
  }, [busqueda, filas])

  const irABusqueda = (id) => {
    graphRef.current?.enfocar(id)
    setMostrarBuscador(false)
    setBusqueda('')
  }

  useEffect(() => {
    let activo = true

    supabase
      .from('radar_respuestas')
      .select('*')
      .order('creado_en', { ascending: true })
      .then(({ data, error: err }) => {
        if (!activo) return
        if (err) {
          console.error('Radar: error al cargar respuestas', err)
          setError(true)
        }
        setFilas(data ?? [])
        setCargando(false)
        yaCargoRef.current = true
      })

    const canal = supabase
      .channel('radar_respuestas_landing')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'radar_respuestas' },
        (payload) => {
          setFilas((prev) => {
            if (prev.some((f) => f.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
          if (yaCargoRef.current) setReciente(payload.new.id)
        },
      )
      .subscribe()

    return () => {
      activo = false
      supabase.removeChannel(canal)
    }
  }, [])

  const { total, entidades } = calcularStats(filas)

  return (
    <div className="relative min-h-screen overflow-hidden px-5 py-14 sm:px-8 sm:py-20">
      <Backdrop />

      <div className="mx-auto max-w-[64rem]">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="press inline-flex items-center gap-2 text-[0.8125rem] font-semibold text-white/70 transition-colors hover:text-white"
          >
            <span aria-hidden="true">&larr;</span> InnoAsturias GovTech 2026
          </Link>
        </div>

        {/* ------------------------------------------------------------- Hero */}
        {/* Dos insignias, no una: la primera dice de dónde viene (para no
            perder el contexto de por qué existe), la segunda deja clarísimo
            que no es cosa de un solo día — sigue abierto siempre, y esa es
            la parte que más se tiende a asumir mal solo con el nombre del
            evento en el título. */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.15em] text-white/80">
            Nacido en InnoAsturias GovTech 2026
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/95 px-3.5 py-1.5 text-[0.6875rem] font-extrabold uppercase tracking-[0.15em] text-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
            Abierto siempre
          </span>
        </div>

        <h1 className="on-photo mt-4 text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.038em] text-white">
          El Radar del ecosistema GovTech asturiano
        </h1>
        <p className="mt-5 max-w-[60ch] text-[1.0625rem] leading-[1.7] text-white/85 sm:text-[1.15rem]">
          Empezó a construirse en directo durante InnoAsturias GovTech 2026, cruzando retos con
          soluciones según iba llegando gente a la sala — pero no se cierra cuando termina la
          jornada. Sigue abierto para siempre: en cualquier momento puedes contar tu reto o tu
          solución y la IA busca, entre todo lo que ya hay aquí, con quién puedes encajar de
          verdad.
        </p>
        <p className="mt-3 text-[0.9375rem] text-white/55">
          {evento.fecha} · {evento.lugar}
        </p>

        {/* Panel propio para la llamada a la acción — separado del párrafo
            de arriba a propósito, para que sea lo primero que salte a la
            vista al entrar, no un enlace más perdido entre texto. */}
        <div className="glass-1 mt-8 flex flex-col gap-5 rounded-plate p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-blush">
              Nunca es tarde para entrar
            </p>
            <p className="mt-2 max-w-[42ch] text-[1.0625rem] font-semibold leading-snug text-white">
              Cuenta tu reto o tu solución ahora mismo y consigue un match de verdad
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Link
              to="/radar/participar"
              className="press group inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3.5 text-[0.95rem] font-bold text-navy hover:bg-blush"
            >
              Sumar mi organización al Radar
              <span
                className="text-[1.05rem] leading-none transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              >
                &rarr;
              </span>
            </Link>
            <Link
              to="/radar/pantalla"
              className="press rounded-full border border-white/40 px-7 py-3.5 text-[0.95rem] font-semibold text-white transition-colors hover:border-white hover:bg-white/12"
            >
              Entrar en el Radar
            </Link>
          </div>
        </div>

        {/* ------------------------------------------------------- Cómo funciona */}
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            {
              n: '1',
              t: 'Cuentas tu reto o tu solución',
              d: 'Un formulario de un minuto, sin registro ni cuenta previa.',
            },
            {
              n: '2',
              t: 'La IA busca coincidencias reales',
              d: 'No por categoría marcada en un checkbox — por lo que de verdad resuelve.',
            },
            {
              n: '3',
              t: 'Si hay match, aparece al momento',
              d: 'Con una frase explicando por qué encajáis, para las dos partes.',
            },
          ].map((s) => (
            <div key={s.n} className="glass-3 rounded-card p-6">
              <span className="text-[1.75rem] font-extrabold leading-none text-blush/90">{s.n}</span>
              <h3 className="mt-3 text-[1rem] font-bold leading-snug text-white">{s.t}</h3>
              <p className="mt-2 text-[0.8125rem] leading-[1.55] text-white/65">{s.d}</p>
            </div>
          ))}
        </div>

        {/* --------------------------------------------------- Quién trae qué */}
        <div className="mt-12 grid gap-3 sm:grid-cols-2">
          {cuadrantes.map((c) => (
            <div key={c.bloque} className="glass-3 rounded-card p-6">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blush">
                {c.aporta}
              </p>
              <h3 className="mt-2 text-[1.25rem] font-extrabold leading-none tracking-[-0.02em] text-white">
                {c.bloque}
              </h3>
              <p className="mt-3 text-[0.875rem] leading-[1.6] text-white/70">{c.texto}</p>
            </div>
          ))}
        </div>

        {/* ------------------------------------------------------- El mapa */}
        <div className="mt-12 flex flex-wrap items-center gap-4">
          <div className="glass-2 flex items-center gap-6 rounded-panel px-6 py-4">
            <div className="text-center">
              <p className="tnum text-[1.75rem] font-extrabold leading-none text-white">{total}</p>
              <p className="mt-1 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-white/60">
                Respuestas
              </p>
            </div>
            <span className="h-8 w-px bg-white/20" aria-hidden="true" />
            <div className="text-center">
              <p className="tnum text-[1.75rem] font-extrabold leading-none text-white">{entidades}</p>
              <p className="mt-1 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-white/60">
                Entidades
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMostrarBuscador(true)}
            className="press glass-2 rounded-panel px-5 py-3 text-[0.8125rem] font-bold text-white transition-colors hover:bg-white/[0.14]"
          >
            Buscar
          </button>

          <button
            type="button"
            onClick={alternarPendientes}
            className={`press relative rounded-panel px-5 py-3 text-[0.8125rem] font-bold transition-colors ${
              modoPendientes ? 'bg-white text-navy' : 'glass-2 text-white hover:bg-white/[0.14]'
            }`}
          >
            {modoPendientes ? 'Cerrar pendientes' : 'Ver pendientes'}
            {!modoPendientes && pendientes.length > 0 && (
              <span
                className="tnum absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-coral text-[0.6875rem] font-extrabold text-white"
                style={{ boxShadow: '0 0 0 2px var(--color-ink)' }}
              >
                {pendientes.length}
              </span>
            )}
          </button>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {ORDEN_PERFILES.map((p) => (
              <span key={p} className="inline-flex items-center gap-2 text-[0.8125rem] text-white/75">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: PERFILES[p].color }}
                  aria-hidden="true"
                />
                {PERFILES[p].corto}
              </span>
            ))}
          </div>
        </div>

        <div className="glass-3 relative z-10 mt-6 rounded-panel p-4 sm:p-8">
          {cargando ? (
            <p className="py-24 text-center text-white/50">Cargando…</p>
          ) : error ? (
            <p className="py-24 text-center text-white/50">
              No se ha podido conectar con el Radar. Revisa la conexión o recarga la página.
            </p>
          ) : filas.length === 0 ? (
            <p className="py-24 text-center text-white/50">
              Esperando la primera respuesta — escanea el código QR en la sala o pulsa arriba
              "Sumar mi organización al Radar".
            </p>
          ) : (
            <RadarGraph ref={graphRef} filas={filas} reciente={reciente} onFocoCambia={setIdEnfocado} />
          )}
        </div>
      </div>

      {mostrarBuscador && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setMostrarBuscador(false)}
          onKeyDown={(e) => e.key === 'Escape' && setMostrarBuscador(false)}
          className="fixed inset-0 z-50 flex cursor-pointer justify-center bg-ink/90 px-6 pt-24 backdrop-blur-sm sm:pt-32"
        >
          <div
            role="presentation"
            onClick={(e) => e.stopPropagation()}
            className="glass-1 h-fit w-full max-w-3xl cursor-default rounded-plate p-6 sm:p-8"
          >
            <p className="text-[0.75rem] font-bold uppercase tracking-[0.2em] text-blush">
              Buscar por institución
            </p>
            <input
              autoFocus
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre de la organización…"
              className="mt-3 w-full rounded-full border border-white/25 bg-white/10 px-5 py-3 text-[1rem] text-white placeholder:text-white/40 outline-none transition-colors focus:border-white focus:bg-white/15"
            />
            <div className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto">
              {busqueda.trim() && resultadosBusqueda.length === 0 && (
                <p className="px-2 py-3 text-[0.875rem] text-white/50">Sin resultados</p>
              )}
              {resultadosBusqueda.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => irABusqueda(f.id)}
                  className="press flex w-full items-start gap-2.5 rounded-card border border-white/10 bg-white/[0.06] px-4 py-3 text-left transition-colors hover:border-white/25 hover:bg-white/[0.12]"
                >
                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: PERFILES[f.perfil]?.color ?? '#fff' }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <p className="truncate text-[0.9375rem] font-bold text-white">{etiquetaNodo(f)}</p>
                    <p className="mt-0.5 line-clamp-1 text-[0.8125rem] text-white/60">{f.necesidad_oferta}</p>
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-[0.75rem] text-white/45">Toca fuera para cerrar</p>
          </div>
        </div>
      )}

      {idEnfocado && (
        <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-1 rounded-full">
          <div className="glass-1 flex items-center gap-1 rounded-full p-1.5">
            <button
              type="button"
              onClick={() => irA(-1)}
              disabled={paresNavegables.length <= 1}
              aria-label="Relación anterior"
              className="press grid h-11 w-11 place-items-center rounded-full text-[1.2rem] font-bold text-white hover:bg-white/10 disabled:opacity-30"
            >
              ‹
            </button>
            <span className="tnum px-3 text-[0.875rem] font-bold text-white">
              {modoPendientes
                ? pendientes.length === 0
                  ? 'Todo comentado 🎉'
                  : `${pendientes.length} pendiente${pendientes.length === 1 ? '' : 's'}`
                : paresNavegables.length === 0
                  ? 'Sin relaciones aún'
                  : posicionActual === -1
                    ? `${paresNavegables.length} relación${paresNavegables.length === 1 ? '' : 'es'}`
                    : `Relación ${posicionActual + 1} de ${paresNavegables.length}`}
            </span>
            <button
              type="button"
              onClick={() => irA(1)}
              disabled={paresNavegables.length <= 1}
              aria-label="Siguiente relación"
              className="press grid h-11 w-11 place-items-center rounded-full text-[1.2rem] font-bold text-white hover:bg-white/10 disabled:opacity-30"
            >
              ›
            </button>
            <span className="mx-1 h-6 w-px bg-white/15" aria-hidden="true" />
            <button
              type="button"
              onClick={cerrarFoco}
              aria-label="Cerrar"
              className="press grid h-11 w-11 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
