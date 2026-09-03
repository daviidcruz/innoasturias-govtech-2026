import { useEffect, useState } from 'react'
import { evento } from '../data/content.js'

const OBJETIVO = new Date(evento.fechaISO).getTime()

function restante() {
  const ms = OBJETIVO - Date.now()
  if (ms <= 0) return null
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

/** Cuenta atrás hasta el comienzo de la jornada. */
export default function Countdown() {
  const [t, setT] = useState(restante)

  useEffect(() => {
    // Si la jornada ya pasó no hay nada que contar: se detiene el intervalo.
    if (!t) return
    const id = setInterval(() => setT(restante()), 1000)
    return () => clearInterval(id)
  }, [t === null])

  if (!t) {
    return (
      <p className="text-center text-[1.0625rem] font-semibold text-white">
        La jornada ya se ha celebrado. Gracias a quienes vinieron.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-4 sm:gap-x-5">
      {UNIDADES.map(([clave, etiqueta], i) => (
        <div key={clave} className="flex items-end gap-3 sm:gap-5">
          {i > 0 && (
            <span
              aria-hidden="true"
              className="mb-[0.9rem] text-[clamp(1.5rem,3vw,2.25rem)] font-light leading-none text-white/30"
            >
              :
            </span>
          )}
          <div className="text-center">
            <span className="tnum block text-[clamp(2.5rem,6.5vw,4.75rem)] font-extrabold leading-[0.85] tracking-[-0.045em] text-white">
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
