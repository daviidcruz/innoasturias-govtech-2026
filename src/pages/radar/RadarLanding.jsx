import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Backdrop from '../../components/Backdrop.jsx'
import { supabase } from '../../lib/supabase.js'
import { evento, cuadrantes } from '../../data/content.js'
import { PERFILES, ORDEN_PERFILES } from '../../data/radar.js'
import RadarGraph from './RadarGraph.jsx'
import { calcularStats } from './radarStats.js'

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
          <span className="inline-flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-blush">
            <span className="h-1.5 w-1.5 rounded-full bg-blush" aria-hidden="true" />
            En directo
          </span>
        </div>

        {/* ------------------------------------------------------------- Hero */}
        <p className="mt-8 text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-blush">
          Radar del ecosistema GovTech asturiano
        </p>
        <h1 className="on-photo mt-2 text-[clamp(2rem,4.8vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.035em] text-white">
          Quién trae qué a InnoAsturias GovTech
        </h1>
        <p className="mt-5 max-w-[56ch] text-[1.0625rem] leading-[1.7] text-white/75">
          Durante InnoAsturias GovTech 2026 construimos en directo un mapa del ecosistema:
          administración, empresas, startups y universidad, cada cual con el reto o la solución
          que trae a la sala. Cada respuesta nueva aparece aquí al momento.
        </p>
        <p className="mt-3 text-[0.9375rem] text-white/55">
          {evento.fecha} · {evento.lugar}
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
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
            Ver a pantalla completa
          </Link>
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
            <RadarGraph filas={filas} reciente={reciente} />
          )}
        </div>
      </div>
    </div>
  )
}
