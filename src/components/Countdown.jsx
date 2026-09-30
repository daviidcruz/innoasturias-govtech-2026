import { useEffect, useState } from 'react'
import { evento } from '../data/content.js'

const INICIO = new Date(evento.fechaISO).getTime()

/** Ya no es cuenta atrás hasta el comienzo — el evento ya ha empezado, así
 *  que ahora cuenta hacia delante desde ese mismo instante. Si por lo que
 *  sea se mira antes de la hora de inicio, se queda en 0 en vez de dar
 *  números negativos. */
function transcurrido() {
  const ms = Math.max(0, Date.now() - INICIO)
  const s = Math.floor(ms / 1000)
  return {
    dias: Math.floor(s / 86400),
    horas: Math.floor((s % 86400) / 3600),
    minutos: Math.floor((s % 3600) / 60),
    segundos: s % 60,
  }
}

const UNIDADES = [
  ['dias', 'días'],
  ['horas', 'horas'],
  ['minutos', 'min'],
  ['segundos', 'seg'],
]

/** Cuenta hacia delante desde el comienzo de la jornada — información del
 *  evento en directo, no una cuenta atrás (esa ya cumplió su función). */
export default function Countdown() {
  const [t, setT] = useState(transcurrido)

  useEffect(() => {
    const id = setInterval(() => setT(transcurrido()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-4 sm:gap-x-5">
      {UNIDADES.map(([clave, etiqueta], i) => (
        <div key={clave} className="flex items-end gap-3 sm:gap-5">
          {i > 0 && (
            <span
              aria-hidden="true"
              className="colon-blink mb-[0.9rem] text-[clamp(1.5rem,3vw,2.25rem)] font-light leading-none text-white/30"
            >
              :
            </span>
          )}
          <div className="text-center">
            {/* La key cambia con cada cifra: React remonta el span y el
                "tick" de entrada se dispara solo, sin JS imperativo. */}
            <span
              key={t[clave]}
              className="tick tnum block text-[clamp(2.5rem,6.5vw,4.75rem)] font-extrabold leading-[0.85] tracking-[-0.045em] text-white"
            >
              {String(t[clave]).padStart(2, '0')}
            </span>
            <span className="mt-2 block text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-white/60">
              {etiqueta}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
