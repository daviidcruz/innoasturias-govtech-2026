import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Backdrop from '../../components/Backdrop.jsx'
import { supabase } from '../../lib/supabase.js'
import { PERFILES, ORDEN_PERFILES } from '../../data/radar.js'
import { conclusiones } from '../../data/radarConclusiones.js'
import RadarGraph from './RadarGraph.jsx'
import { calcularStats } from './radarStats.js'

/**
 * /radar/resultados — la versión que queda publicada para siempre. Misma
 * visualización que /radar/pantalla, pero congelada: se carga una vez al
 * abrir la página, sin suscripción a Realtime (el evento ya pasó, no hay
 * nada nuevo que esperar).
 */
export default function RadarResultados() {
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let activo = true
    supabase
      .from('radar_respuestas')
      .select('*')
      .order('creado_en', { ascending: true })
      .then(({ data, error: err }) => {
        if (!activo) return
        if (err) {
          console.error('Radar: error al cargar resultados', err)
          setError(true)
        }
        setFilas(data ?? [])
        setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [])

  const { total, entidades } = calcularStats(filas)

  return (
    <div className="relative min-h-screen overflow-hidden px-5 py-16 sm:px-8 sm:py-20">
      <Backdrop />

      <div className="mx-auto max-w-[64rem]">
        <Link
          to="/"
          className="press inline-flex items-center gap-2 text-[0.8125rem] font-semibold text-white/70 transition-colors hover:text-white"
        >
          <span aria-hidden="true">&larr;</span> InnoAsturias GovTech 2026
        </Link>

        <p className="mt-8 text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-blush">
          Resultados públicos
        </p>
        <h1 className="on-photo mt-2 text-[clamp(2rem,4.8vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.035em] text-white">
          Radar del ecosistema GovTech asturiano
        </h1>
        <p className="mt-5 max-w-[52ch] text-[1.0625rem] leading-[1.7] text-white/75">
          Mapa construido en directo durante InnoAsturias GovTech 2026 con las respuestas de
          quienes asistieron: administración, empresas, startups y universidad, agrupadas por el
          reto o la solución que trajeron a la sala.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
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

        <div className="glass-3 mt-8 rounded-panel p-4 sm:p-8">
          {cargando ? (
            <p className="py-24 text-center text-white/50">Cargando…</p>
          ) : error ? (
            <p className="py-24 text-center text-white/50">
              No se ha podido cargar el Radar ahora mismo. Prueba a recargar la página.
            </p>
          ) : filas.length === 0 ? (
            <p className="py-24 text-center text-white/50">Todavía no hay respuestas registradas.</p>
          ) : (
            <RadarGraph filas={filas} reciente={null} />
          )}
        </div>

        <div className="glass-2 mt-10 rounded-panel p-7 sm:p-10">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-blush">
            Conclusiones
          </p>
          {conclusiones.publicado ? (
            <div className="mt-4 space-y-4">
              {conclusiones.parrafos.map((p, i) => (
                <p key={i} className="text-[1rem] leading-[1.7] text-white/85">
                  {p}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-[1rem] leading-[1.7] text-white/70">
              Este apartado se completa después del evento, con la lectura de los organizadores
              sobre el Radar: qué área concentró más respuestas, qué proporción hubo entre
              administración y empresa, y el estado del ecosistema GovTech asturiano.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
