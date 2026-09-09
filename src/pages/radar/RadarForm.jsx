import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Backdrop from '../../components/Backdrop.jsx'
import { supabase } from '../../lib/supabase.js'
import { PERFILES, ORDEN_PERFILES, AREAS, ORDEN_AREAS, preguntaReto } from '../../data/radar.js'

const LIMITE_TEXTO = 120
const TOTAL_PASOS = 4

const easeSalida = [0.16, 1, 0.3, 1]
const variantesPaso = {
  entra: (dir) => ({ opacity: 0, x: dir > 0 ? 28 : -28 }),
  centro: { opacity: 1, x: 0 },
  sale: (dir) => ({ opacity: 0, x: dir > 0 ? -28 : 28 }),
}

function Progreso({ paso }) {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      {Array.from({ length: TOTAL_PASOS }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all duration-400 ${
            i < paso ? 'w-6 bg-white' : 'w-1.5 bg-white/25'
          }`}
        />
      ))}
    </div>
  )
}

function BotonAtras({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press mb-5 inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-white/60 transition-colors hover:text-white"
    >
      <span aria-hidden="true">&larr;</span> Atrás
    </button>
  )
}

/**
 * /radar — el formulario que la gente rellena desde el móvil, escaneando el
 * QR en la sala. Cuatro pasos, sin login: perfil → organización (opcional)
 * → la pregunta según el perfil → área. Al enviar, un único INSERT a
 * Supabase; la política RLS de la tabla no permite ni editar ni borrar
 * después, así que no hace falta pantalla de "revisar antes de enviar".
 */
export default function RadarForm() {
  const [paso, setPaso] = useState(1)
  const [dir, setDir] = useState(1)
  const [perfil, setPerfil] = useState(null)
  const [organizacion, setOrganizacion] = useState('')
  const [ocultarNombre, setOcultarNombre] = useState(false)
  const [necesidadOferta, setNecesidadOferta] = useState('')
  const [areas, setAreas] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState(null)

  const ir = (siguiente) => {
    setDir(siguiente > paso ? 1 : -1)
    setPaso(siguiente)
  }

  const elegirPerfil = (p) => {
    setPerfil(p)
    ir(2)
  }

  const alternarArea = (a) => {
    setAreas((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))
  }

  const enviar = async () => {
    setEnviando(true)
    setError(null)
    const { error: err } = await supabase.from('radar_respuestas').insert({
      perfil,
      organizacion: organizacion.trim() || null,
      visible: Boolean(organizacion.trim()) && !ocultarNombre,
      necesidad_oferta: necesidadOferta.trim(),
      areas,
    })
    setEnviando(false)
    if (err) {
      console.error('Radar: error al enviar', err)
      setError('No se ha podido enviar. Comprueba la conexión e inténtalo otra vez.')
      return
    }
    setEnviado(true)
  }

  return (
    <div className="relative flex min-h-[100svh] flex-col items-center justify-center px-4 py-10">
      <Backdrop />

      <div className="relative w-full max-w-[30rem]">
        <div className="mb-5 flex items-center justify-between">
          <Link to="/" className="text-[0.75rem] font-semibold text-white/50 hover:text-white">
            InnoAsturias GovTech 2026
          </Link>
          {!enviado && <Progreso paso={paso} />}
        </div>

        <div className="glass-1 overflow-hidden rounded-plate p-7 sm:p-9">
          <AnimatePresence mode="wait" custom={dir}>
            {enviado ? (
              <motion.div
                key="gracias"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: easeSalida }}
                className="py-6 text-center"
              >
                <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-mint/95">
                  <span className="text-[1.75rem] text-ink" aria-hidden="true">
                    ✓
                  </span>
                </div>
                <h1 className="text-[1.5rem] font-extrabold leading-tight text-white">
                  Gracias, tu aportación ya forma parte del Radar
                </h1>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-white/70">
                  Se está proyectando en directo en la sala.
                </p>
                <Link
                  to="/"
                  className="press mt-7 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[0.9rem] font-bold text-navy hover:bg-blush"
                >
                  Volver a la web del evento
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key={paso}
                custom={dir}
                variants={variantesPaso}
                initial="entra"
                animate="centro"
                exit="sale"
                transition={{ duration: 0.32, ease: easeSalida }}
              >
                {paso === 1 && (
                  <div>
                    <h1 className="text-[1.375rem] font-extrabold leading-tight text-white">
                      ¿Quién eres?
                    </h1>
                    <div className="mt-6 grid gap-3">
                      {ORDEN_PERFILES.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => elegirPerfil(p)}
                          className="press glass-3 flex items-center gap-3 rounded-card px-5 py-4 text-left transition-colors hover:border-white/30 hover:bg-white/[0.09]"
                        >
                          <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: PERFILES[p].color }}
                            aria-hidden="true"
                          />
                          <span className="text-[1rem] font-semibold text-white">
                            {PERFILES[p].label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {paso === 2 && (
                  <div>
                    <BotonAtras onClick={() => ir(1)} />
                    <h1 className="text-[1.375rem] font-extrabold leading-tight text-white">
                      Tu organización
                    </h1>
                    <label htmlFor="organizacion" className="mt-6 block text-[0.875rem] text-white/75">
                      Nombre de tu organización o administración (opcional)
                    </label>
                    <input
                      id="organizacion"
                      type="text"
                      value={organizacion}
                      onChange={(e) => setOrganizacion(e.target.value)}
                      placeholder="Ej. Ayuntamiento de Oviedo"
                      className="mt-2 w-full rounded-full border border-white/25 bg-white/10 px-5 py-3 text-[1rem] text-white placeholder:text-white/40 outline-none transition-colors focus:border-white focus:bg-white/15"
                    />

                    {organizacion.trim() && (
                      <motion.label
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 flex cursor-pointer items-start gap-3 text-[0.875rem] text-white/75"
                      >
                        <input
                          type="checkbox"
                          checked={ocultarNombre}
                          onChange={(e) => setOcultarNombre(e.target.checked)}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-white"
                        />
                        Prefiero que el nombre de mi organización no aparezca en los resultados
                        públicos
                      </motion.label>
                    )}

                    <button
                      type="button"
                      onClick={() => ir(3)}
                      className="press mt-7 w-full rounded-full bg-white px-6 py-3.5 text-[0.95rem] font-bold text-navy hover:bg-blush"
                    >
                      Siguiente
                    </button>
                  </div>
                )}

                {paso === 3 && (
                  <div>
                    <BotonAtras onClick={() => ir(2)} />
                    <h1 className="text-[1.375rem] font-extrabold leading-tight text-white">
                      {preguntaReto(perfil)}
                    </h1>
                    <textarea
                      value={necesidadOferta}
                      onChange={(e) => setNecesidadOferta(e.target.value.slice(0, LIMITE_TEXTO))}
                      rows={3}
                      placeholder="En pocas palabras…"
                      className="mt-6 w-full resize-none rounded-card border border-white/25 bg-white/10 px-5 py-4 text-[1rem] text-white placeholder:text-white/40 outline-none transition-colors focus:border-white focus:bg-white/15"
                    />
                    <p className="mt-2 text-right text-[0.75rem] text-white/45">
                      {necesidadOferta.length}/{LIMITE_TEXTO}
                    </p>

                    <button
                      type="button"
                      disabled={!necesidadOferta.trim()}
                      onClick={() => ir(4)}
                      className="press mt-5 w-full rounded-full bg-white px-6 py-3.5 text-[0.95rem] font-bold text-navy transition-opacity hover:bg-blush disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
                    >
                      Siguiente
                    </button>
                  </div>
                )}

                {paso === 4 && (
                  <div>
                    <BotonAtras onClick={() => ir(3)} />
                    <h1 className="text-[1.375rem] font-extrabold leading-tight text-white">
                      ¿En qué áreas encaja esto?
                    </h1>
                    <p className="mt-1.5 text-[0.8125rem] text-white/55">Puedes marcar más de una.</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {ORDEN_AREAS.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => alternarArea(a)}
                          aria-pressed={areas.includes(a)}
                          className={`press rounded-full border px-4 py-2.5 text-[0.9rem] font-semibold transition-colors ${
                            areas.includes(a)
                              ? 'border-white bg-white text-navy'
                              : 'border-white/25 bg-white/10 text-white hover:border-white/45 hover:bg-white/15'
                          }`}
                        >
                          {AREAS[a]}
                        </button>
                      ))}
                    </div>

                    {error && <p className="mt-4 text-[0.875rem] text-coral">{error}</p>}

                    <button
                      type="button"
                      disabled={areas.length === 0 || enviando}
                      onClick={enviar}
                      className="press mt-7 w-full rounded-full bg-white px-6 py-3.5 text-[0.95rem] font-bold text-navy transition-opacity hover:bg-blush disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
                    >
                      {enviando ? 'Enviando…' : 'Enviar'}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
