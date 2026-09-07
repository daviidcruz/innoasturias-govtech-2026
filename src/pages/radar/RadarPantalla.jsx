import { useEffect, useRef, useState } from 'react'
import Backdrop from '../../components/Backdrop.jsx'
import { supabase } from '../../lib/supabase.js'
import { PERFILES, ORDEN_PERFILES } from '../../data/radar.js'
import RadarGraph from './RadarGraph.jsx'
import { calcularStats } from './radarStats.js'

/**
 * /radar/pantalla — para proyectar, sin más. Nadie la toca durante el
 * evento: carga lo que ya hay y luego escucha Realtime para que cada
 * respuesta nueva aparezca sola, sin recargar.
 */
export default function RadarPantalla() {
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
          // "Esperando la primera respuesta" y "no ha cargado nada" no son
          // lo mismo: el primero es normal al empezar el evento, el segundo
          // necesita que alguien lo mire — no deben verse igual proyectados.
          console.error('Radar: error al cargar respuestas', err)
          setError(true)
        }
        setFilas(data ?? [])
        setCargando(false)
        yaCargoRef.current = true
      })

    const canal = supabase
      .channel('radar_respuestas_en_vivo')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'radar_respuestas' },
        (payload) => {
          setFilas((prev) => {
            if (prev.some((f) => f.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
          // Solo la que acaba de llegar por Realtime hace el pulso de
          // aparición; las cargadas al entrar en la página no.
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
    <div className="relative min-h-screen overflow-hidden px-6 py-8 sm:px-10 sm:py-10">
      <Backdrop />

      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-blush">
            InnoAsturias GovTech 2026 · En directo
          </p>
          <h1 className="on-photo mt-2 text-[clamp(1.75rem,3.4vw,2.75rem)] font-extrabold leading-none tracking-[-0.03em] text-white">
            Radar del ecosistema
          </h1>
        </div>

        <div className="glass-2 flex items-center gap-6 rounded-panel px-6 py-4 sm:gap-8">
          <div className="text-center">
            <p className="tnum text-[2rem] font-extrabold leading-none text-white">{total}</p>
            <p className="mt-1 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-white/60">
              Respuestas
            </p>
          </div>
          <span className="h-9 w-px bg-white/20" aria-hidden="true" />
          <div className="text-center">
            <p className="tnum text-[2rem] font-extrabold leading-none text-white">{entidades}</p>
            <p className="mt-1 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-white/60">
              Entidades
            </p>
          </div>
        </div>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
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

      <div className="glass-3 mt-8 rounded-panel p-4 sm:p-8">
        {cargando ? (
          <p className="py-24 text-center text-white/50">Cargando…</p>
        ) : error ? (
          <p className="py-24 text-center text-white/50">
            No se ha podido conectar con el Radar. Revisa la conexión o recarga la página.
          </p>
        ) : filas.length === 0 ? (
          <p className="py-24 text-center text-white/50">
            Esperando la primera respuesta — escanea el código QR para participar.
          </p>
        ) : (
          <RadarGraph filas={filas} reciente={reciente} />
        )}
      </div>
    </div>
  )
}
