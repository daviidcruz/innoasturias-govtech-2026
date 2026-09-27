import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import Backdrop from '../../components/Backdrop.jsx'
import { supabase } from '../../lib/supabase.js'
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

// window.location.origin, no un dominio escrito a mano: así el QR apunta a
// localhost en desarrollo y al dominio real en cuanto esto se despliegue,
// sin tocar el código.
const URL_FORMULARIO = `${window.location.origin}/radar/participar`

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
  const [mostrarQR, setMostrarQR] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const yaCargoRef = useRef(false)
  const graphRef = useRef(null)

  // Los matches y lo ya comentado también hacen falta aquí (no solo dentro
  // de RadarGraph): el carrusel de pendientes necesita saber cuáles quedan
  // sin comentar para poder ir pasando de uno a otro con flechas.
  const matches = useMatches()
  const { vistos } = useVistos()

  const [modoPendientes, setModoPendientes] = useState(false)
  const [idPendienteActual, setIdPendienteActual] = useState(null)

  // Solo los matches donde AL MENOS uno de los dos lados sigue sin
  // comentar — en cuanto se hace foco en un par, las dos tarjetas quedan
  // marcadas como vistas y el par desaparece de esta lista. Orden de
  // llegada (el más antiguo primero), para repasar en el mismo orden en
  // que fue pasando la sesión.
  const pendientes = useMemo(
    () =>
      matches
        .filter((m) => !vistos.has(m.reto_id) || !vistos.has(m.solucion_id))
        .sort((a, b) => new Date(a.creado_en) - new Date(b.creado_en)),
    [matches, vistos],
  )

  const irAPendiente = (delta) => {
    if (pendientes.length === 0) return
    const posActual = pendientes.findIndex((p) => p.reto_id === idPendienteActual)
    // Si el par que se estaba viendo ya no está en la lista (se acaba de
    // marcar como comentado al enfocarlo), se continúa desde el principio
    // de la lista ya actualizada, no desde una posición que ya no existe.
    const base = posActual === -1 ? -1 : posActual
    const total = pendientes.length
    const siguiente = pendientes[((base + delta) % total + total) % total]
    setIdPendienteActual(siguiente.reto_id)
    graphRef.current?.enfocar(siguiente.reto_id)
  }

  const alternarPendientes = () => {
    if (modoPendientes) {
      setModoPendientes(false)
      graphRef.current?.cerrar()
      return
    }
    setModoPendientes(true)
    if (pendientes.length > 0) {
      setIdPendienteActual(pendientes[0].reto_id)
      graphRef.current?.enfocar(pendientes[0].reto_id)
    }
  }

  // Con un mando/clicker de presentación (que suele enviar las flechas del
  // teclado) se puede pasar de pendiente sin tener que apuntar con el ratón.
  useEffect(() => {
    if (!modoPendientes) return
    const alTeclado = (e) => {
      if (e.key === 'ArrowRight') irAPendiente(1)
      else if (e.key === 'ArrowLeft') irAPendiente(-1)
      else if (e.key === 'Escape') alternarPendientes()
    }
    window.addEventListener('keydown', alTeclado)
    return () => window.removeEventListener('keydown', alTeclado)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoPendientes, pendientes, idPendienteActual])

  // Buscador por institución/organización (o por perfil) — para cuando
  // alguien dice que no ha visto la suya: se teclea el nombre y se enfoca
  // directamente, sin tener que rastrear el mapa a ojo.
  const [mostrarBuscador, setMostrarBuscador] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  const resultadosBusqueda = useMemo(() => {
    const q = normalizar(busqueda.trim())
    if (!q) return []
    return filas.filter((f) => normalizar(etiquetaNodo(f)).includes(q) || normalizar(f.necesidad_oferta).includes(q)).slice(0, 8)
  }, [busqueda, filas])

  const irABusqueda = (id) => {
    graphRef.current?.enfocar(id)
    setMostrarBuscador(false)
    setBusqueda('')
  }

  useEffect(() => {
    QRCode.toDataURL(URL_FORMULARIO, { width: 480, margin: 1 })
      .then(setQrDataUrl)
      .catch((err) => console.error('Radar: error al generar el QR', err))
  }, [])

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

        <div className="flex items-center gap-3">
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

          <button
            type="button"
            onClick={() => setMostrarQR(true)}
            className="press glass-2 rounded-panel px-5 py-3 text-[0.8125rem] font-bold text-white transition-colors hover:bg-white/[0.14]"
          >
            Mostrar QR
          </button>
        </div>
      </header>

      {mostrarBuscador && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setMostrarBuscador(false)}
          onKeyDown={(e) => e.key === 'Escape' && setMostrarBuscador(false)}
          className="fixed inset-0 z-50 grid cursor-pointer place-items-start justify-center bg-ink/90 px-6 pt-24 backdrop-blur-sm sm:pt-32"
        >
          <div
            role="presentation"
            onClick={(e) => e.stopPropagation()}
            className="glass-1 w-full max-w-xl cursor-default rounded-plate p-6 sm:p-8"
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

      {modoPendientes && (
        <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-1 rounded-full">
          <div className="glass-1 flex items-center gap-1 rounded-full p-1.5">
            <button
              type="button"
              onClick={() => irAPendiente(-1)}
              disabled={pendientes.length === 0}
              aria-label="Pendiente anterior"
              className="press grid h-11 w-11 place-items-center rounded-full text-[1.2rem] font-bold text-white hover:bg-white/10 disabled:opacity-30"
            >
              ‹
            </button>
            <span className="tnum px-3 text-[0.875rem] font-bold text-white">
              {pendientes.length === 0 ? 'Todo comentado 🎉' : `${pendientes.length} pendiente${pendientes.length === 1 ? '' : 's'}`}
            </span>
            <button
              type="button"
              onClick={() => irAPendiente(1)}
              disabled={pendientes.length === 0}
              aria-label="Siguiente pendiente"
              className="press grid h-11 w-11 place-items-center rounded-full text-[1.2rem] font-bold text-white hover:bg-white/10 disabled:opacity-30"
            >
              ›
            </button>
            <span className="mx-1 h-6 w-px bg-white/15" aria-hidden="true" />
            <button
              type="button"
              onClick={alternarPendientes}
              aria-label="Cerrar carrusel de pendientes"
              className="press grid h-11 w-11 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {mostrarQR && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setMostrarQR(false)}
          onKeyDown={(e) => e.key === 'Escape' && setMostrarQR(false)}
          className="fixed inset-0 z-50 grid cursor-pointer place-items-center bg-ink/90 px-6 backdrop-blur-sm"
        >
          <div className="glass-1 rounded-plate px-10 py-10 text-center sm:px-14 sm:py-12">
            <p className="text-[0.75rem] font-bold uppercase tracking-[0.2em] text-blush">
              Escanea para participar
            </p>
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt={`Código QR hacia ${URL_FORMULARIO}`}
                className="mx-auto mt-6 h-[min(60vh,22rem)] w-[min(60vh,22rem)] rounded-card bg-white p-4"
              />
            )}
            <p className="tnum mt-5 text-[1rem] text-white/70">{URL_FORMULARIO}</p>
            <p className="mt-4 text-[0.8125rem] text-white/45">Toca en cualquier sitio para cerrar</p>
          </div>
        </div>
      )}

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
        <span className="h-4 w-px bg-white/20" aria-hidden="true" />
        <span className="inline-flex items-center gap-2 text-[0.75rem] text-white/75">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: 'var(--color-coral)' }} aria-hidden="true" />
          Reto
        </span>
        <span className="inline-flex items-center gap-2 text-[0.75rem] text-white/75">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: 'var(--color-mint)' }} aria-hidden="true" />
          Solución
        </span>
        <span className="h-4 w-px bg-white/20" aria-hidden="true" />
        <span className="inline-flex items-center gap-2 text-[0.75rem] text-white/75">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: 'var(--color-blush)' }} aria-hidden="true" />
          Sin comentar todavía
        </span>
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
          <RadarGraph ref={graphRef} filas={filas} reciente={reciente} llenarAltura />
        )}
      </div>
    </div>
  )
}
