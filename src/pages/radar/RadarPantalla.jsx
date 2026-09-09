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
    <div className="relative flex h-[100svh] flex-col overflow-hidden px-6 py-5 sm:px-10 sm:py-6">
      <Backdrop />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-blush">
            InnoAsturias GovTech 2026 · En directo
          </p>
          <h1 className="on-photo mt-1 text-[clamp(1.5rem,3vw,2.5rem)] font-extrabold leading-none tracking-[-0.03em] text-white">
            Radar del ecosistema
          </h1>
        </div>

        <div className="glass-2 flex items-center gap-5 rounded-panel px-5 py-3 sm:gap-7">
          <div className="text-center">
            <p className="tnum text-[1.6rem] font-extrabold leading-none text-white">{total}</p>
            <p className="mt-1 text-[0.625rem] font-bold uppercase tracking-[0.14em] text-white/60">
              Respuestas
            </p>
          </div>
          <span className="h-8 w-px bg-white/20" aria-hidden="true" />
          <div className="text-center">
            <p className="tnum text-[1.6rem] font-extrabold leading-none text-white">{entidades}</p>
            <p className="mt-1 text-[0.625rem] font-bold uppercase tracking-[0.14em] text-white/60">
              Entidades
            </p>
          </div>
        </div>
      </header>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
        {ORDEN_PERFILES.map((p) => (
          <span key={p} className="inline-flex items-center gap-2 text-[0.75rem] text-white/75">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: PERFILES[p].color }}
              aria-hidden="true"
            />
            {PERFILES[p].corto}
          </span>
        ))}
      </div>

      <div className="glass-3 relative z-10 mt-4 min-h-0 flex-1 rounded-panel p-3 sm:p-5">
        {cargando ? (
          <p className="grid h-full place-items-center text-center text-white/50">Cargando…</p>
        ) : error ? (
          <p className="grid h-full place-items-center px-8 text-center text-white/50">
            No se ha podido conectar con el Radar. Revisa la conexión o recarga la página.
          </p>
        ) : filas.length === 0 ? (
          <p className="grid h-full place-items-center px-8 text-center text-white/50">
            Esperando la primera respuesta — escanea el código QR para participar.
          </p>
        ) : (
          <RadarGraph filas={filas} reciente={reciente} llenarAltura />
        )}
      </div>
    </div>
  )
}
