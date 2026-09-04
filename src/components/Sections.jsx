import Countdown from './Countdown.jsx'
import { useInView, useSectionIn, useClock } from '../hooks/useInView.js'
import { objetivos, programa, cuadrantes, temas, evento } from '../data/content.js'

/* ---------------------------------- piezas --------------------------------- */

function Shell({ id, children, className = '', innerRef }) {
  return (
    <section ref={innerRef} id={id} className={`relative px-5 sm:px-8 ${className}`}>
      <div className="mx-auto max-w-[84rem]">{children}</div>
    </section>
  )
}

/* Los titulares van sueltos sobre la foto y el contenido dentro del cristal:
   ese contraste es el ritmo de la página. */
function Titular({ children, className = '', ...rest }) {
  return (
    <h2
      className={`on-photo text-[clamp(2.1rem,4.8vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.035em] ${className}`}
      {...rest}
    >
      {children}
    </h2>
  )
}

/* -------------------------------- Cuenta atrás ----------------------------- */

/* Fecha y hora, en un dato: son cortos y van juntos. El lugar es harina de
   otro costal —nombre del sitio y dirección postal, dos frases— así que
   forzarlo en la misma caja de tres columnas iguales que "Fecha" y "Horario"
   dejaba una celda desbordada y las otras dos con hueco de sobra. Ahora el
   lugar tiene su propia tarjeta, del tamaño que le corresponde, con enlace
   directo al mapa: información útil de verdad, no sólo texto de relleno. */
const fechaHora = `${evento.fecha} · 09:00 – 14:30 h`
const mapaUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${evento.lugar}, ${evento.direccion}`,
)}`

export function CuentaAtras() {
  const ref = useInView()

  return (
    <Shell innerRef={ref} className="pb-16 pt-20 sm:pb-20 sm:pt-24">
      <div data-reveal="lift" className="glass-2 rounded-panel p-7 text-center sm:p-10">
        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-blush">Faltan</p>
        <div className="mt-5">
          <Countdown />
        </div>

        <p className="mt-7 text-[0.9375rem] text-white/75">{fechaHora}</p>

        <div className="mx-auto mt-5 flex max-w-[26rem] flex-col items-center gap-4 rounded-card border border-white/12 bg-white/[0.04] px-6 py-5 sm:max-w-none sm:w-fit sm:flex-row sm:gap-6 sm:px-7">
          <div>
            <p className="text-[1rem] font-semibold leading-snug text-white">{evento.lugar}</p>
            <p className="mt-0.5 text-[0.8125rem] text-white/60">{evento.direccion}</p>
          </div>
          <a
            href={mapaUrl}
            target="_blank"
            rel="noopener"
            className="press inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/25 px-5 py-2.5 text-[0.8125rem] font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
          >
            Cómo llegar
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </Shell>
  )
}

/* ------------------------------- El encuentro ------------------------------ */

export function Encuentro() {
  const ref = useInView()

  return (
    <Shell innerRef={ref} id="encuentro" className="py-16 sm:py-24">
      <Titular className="max-w-[24ch]" data-reveal="up">
        Una mañana para pasar de la conversación a la acción.
      </Titular>

      <div className="mt-12 grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div data-reveal="lift" className="glass-2 rounded-panel p-8 sm:p-10 lg:p-12">
          <p className="max-w-[52ch] text-[1.125rem] leading-[1.7] text-white">
            Asturias tiene capacidades tecnológicas, conocimiento y tejido innovador. Lo que faltaba
            era una sala donde la Administración traiga sus retos y el ecosistema traiga sus
            soluciones.
          </p>
          <p className="mt-5 max-w-[52ch] text-[1.0625rem] leading-[1.75] text-white/70">
            <strong className="font-semibold text-white">InnoAsturias GovTech 2026</strong> aplica al
            contexto asturiano una metodología propia de Fundación NovaGob, contrastada a lo largo de
            más de doce años: identificar retos reales, mapear las capacidades que ya hay en el
            territorio y activar colaboración con impacto económico.
          </p>

          <ul className="mt-10 flex flex-wrap gap-2">
            {temas.map((t) => (
              <li
                key={t}
                className="rounded-full border border-white/16 bg-white/[0.07] px-4 py-2 text-[0.875rem] text-white/85"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div
          data-reveal="lift"
          style={{ '--d': '110ms' }}
          className="glass-3 rounded-panel p-8 sm:p-10"
        >
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-white/55">
            Lo que se lleva cada asistente
          </p>
          <dl className="mt-6">
            {objetivos.map((o, i) => (
              <div
                key={o.titulo}
                className={`py-4 ${i < objetivos.length - 1 ? 'border-b border-white/10' : 'pb-0'}`}
              >
                <dt className="text-[1.0625rem] font-bold leading-tight tracking-[-0.02em] text-white">
                  {o.titulo}
                </dt>
                <dd className="mt-1.5 text-[0.9375rem] leading-[1.6] text-white/70">{o.texto}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Shell>
  )
}

/* -------------------------------- La jornada ------------------------------- */

const tipo = {
  logistica: { punto: 'bg-white/50', label: 'Logística' },
  institucional: { punto: 'bg-lilac', label: 'Institucional' },
  contenido: { punto: 'bg-azure', label: 'Contenido' },
  dinamica: { punto: 'bg-coral', label: 'Dinámica' },
}

/* El Radar ordena el ecosistema y el matching es el elemento tractor de la
   jornada. Lo dice la memoria; que lo diga también la tipografía. */
const destacados = new Set(['Radar del ecosistema', 'Matching'])

export function Jornada() {
  const reveal = useInView()
  const [clockRef, now] = useClock(programa.length)

  return (
    <Shell innerRef={reveal} id="programa" className="py-16 sm:py-24">
      {/* La columna de la izquierda queda fija mientras se recorre el
          programa: si no se ancla, el titular pasa en un parpadeo y no hay
          forma de recuperarlo salvo subiendo de nuevo. */}
      <div className="grid gap-x-12 gap-y-10 sm:grid-cols-[0.8fr_1.2fr] lg:gap-x-16">
        <div className="sm:sticky sm:top-24 sm:self-start" data-reveal="up">
          <Titular>
            Media jornada.
            <br />
            Cero relleno.
          </Titular>
          <p className="on-photo mt-6 max-w-[36ch] text-[0.9375rem] leading-relaxed text-white/80">
            Marco estratégico, contraste de realidades, capacitación práctica, ordenación del
            ecosistema, demostración aplicada y activación de oportunidades. En ese orden.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[0.8125rem] text-white/75">
            {['contenido', 'dinamica', 'institucional', 'logistica'].map((k) => (
              <span key={k} className="inline-flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${tipo[k].punto}`} />
                {tipo[k].label}
              </span>
            ))}
          </div>
        </div>

        {/* Cada bloque es su propio panel de cristal. El que cruza la línea
            de lectura pasa al primer plano: el reloj lo marca el material. */}
        <ol ref={clockRef} className="flex flex-col gap-3">
        {programa.map((p, i) => {
          const peak = destacados.has(p.titulo)
          return (
            <li
              key={p.hora}
              data-slot={i}
              data-reveal="rise"
              style={{ '--d': `${Math.min(i, 5) * 60}ms` }}
              className={`slot glass-3 rounded-card px-6 py-6 sm:px-8 sm:py-7 ${
                i === now ? 'is-now' : ''
              }`}
            >
              <div className="grid gap-x-8 gap-y-3 sm:grid-cols-[9.5rem_1fr]">
                <div className="flex items-center gap-3 sm:block">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full sm:mb-3 ${tipo[p.tipo].punto}`}
                    aria-hidden="true"
                  />
                  <span className="slot__hour tnum block text-[1.0625rem] font-bold leading-none tracking-[-0.02em] text-white/80 sm:text-[1.15rem]">
                    {p.hora}
                  </span>
                  <span className="ml-auto text-[0.6875rem] uppercase tracking-[0.14em] text-white/45 sm:ml-0 sm:mt-2 sm:block">
                    {tipo[p.tipo].label}
                  </span>
                </div>

                <div>
                  <h3
                    className={
                      peak
                        ? 'text-[1.3rem] font-extrabold leading-tight tracking-[-0.028em] text-white sm:text-[1.7rem]'
                        : 'text-[1.15rem] font-bold leading-tight tracking-[-0.02em] text-white sm:text-[1.35rem]'
                    }
                  >
                    {p.titulo}
                  </h3>
                  <p className="mt-2.5 max-w-[64ch] text-[0.9375rem] leading-[1.7] text-white/75 sm:text-[1rem]">
                    {p.texto}
                  </p>
                </div>
              </div>
            </li>
          )
        })}
        </ol>
      </div>
    </Shell>
  )
}

/* --------------------------------- El Radar -------------------------------- */

/* Cada cuadrante entra desde su esquina y converge en el punto de cruce: el
   Radar es el instrumento que sienta a los cuatro mundos en la misma mesa. */
const desde = [
  { '--fx': '-30px', '--fy': '-30px' },
  { '--fx': '30px', '--fy': '-30px' },
  { '--fx': '-30px', '--fy': '30px' },
  { '--fx': '30px', '--fy': '30px' },
]

export function Radar() {
  const ref = useSectionIn(0.24)

  return (
    <Shell id="participantes" className="py-16 sm:py-24">
      <div className="flex flex-wrap items-end justify-between gap-8">
        <Titular className="max-w-[20ch]">Cuatro mundos, una misma mesa</Titular>
        <p className="on-photo max-w-[34ch] text-[0.9375rem] leading-relaxed text-white/80">
          El Radar ordena a los asistentes en cuatro bloques y busca los huecos: quién puede resolver
          qué, y con quién todavía no ha hablado.
        </p>
      </div>

      <div ref={ref} className="radar glass-2 relative mt-12 overflow-hidden rounded-panel">
        {/* Anillos de madurez centrados en el punto de cruce */}
        <div
          aria-hidden="true"
          className="rings pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[min(80%,44rem)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle_at_50%_50%,transparent_0,transparent_calc(20%-1px),rgba(255,255,255,0.12)_calc(20%-1px),rgba(255,255,255,0.12)_20%,transparent_20%,transparent_calc(34%-1px),rgba(255,255,255,0.09)_calc(34%-1px),rgba(255,255,255,0.09)_34%,transparent_34%,transparent_calc(48%-1px),rgba(255,255,255,0.06)_calc(48%-1px),rgba(255,255,255,0.06)_48%,transparent_48%)]"
        />

        {/* Filas de altura idéntica (auto-rows-fr): el cruce cae justo en el
            50 % del panel, así que la píldora queda centrada de verdad. */}
        <div className="relative grid sm:auto-rows-fr sm:grid-cols-2">
          {cuadrantes.map((c, i) => (
            <div
              key={c.bloque}
              className={`quad p-8 sm:p-10 lg:p-14 ${i % 2 === 0 ? 'sm:border-r sm:border-white/14' : ''} ${
                i < 2 ? 'border-b border-white/14' : ''
              }`}
              style={{ ...desde[i], '--d': `${i * 110}ms` }}
            >
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blush">
                {c.aporta}
              </p>
              <h3 className="mt-3 text-[clamp(1.5rem,2.6vw,2.125rem)] font-extrabold leading-none tracking-[-0.03em]">
                {c.bloque}
              </h3>
              <p className="mt-4 max-w-[40ch] text-[0.9375rem] leading-[1.65] text-white/75">
                {c.texto}
              </p>
            </div>
          ))}
        </div>

        <div className="cross pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 sm:block">
          <span className="block whitespace-nowrap rounded-full bg-ink/85 px-4 py-2 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-white ring-1 ring-white/20 backdrop-blur-sm">
            Retos &harr; Soluciones
          </span>
        </div>
      </div>
    </Shell>
  )
}

/* ---------------------------------- Footer --------------------------------- */

export function Footer() {
  const ref = useInView()

  return (
    <footer ref={ref} className="relative px-5 pb-10 pt-16 sm:px-8 sm:pt-24">
      <div className="mx-auto max-w-[84rem]">
        {/* Todo el pie vive dentro del mismo panel: nada suelto sobre el
            fondo, ni el copyright ni la navegación. */}
        <div data-reveal="lift" className="glass-1 rounded-panel p-8 sm:rounded-plate sm:p-12">
          <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[1.5rem] font-extrabold leading-none tracking-[-0.03em] text-white sm:text-[1.75rem]">
                InnoAsturias <span className="font-light text-white/60">GovTech 2026</span>
              </p>
              <p className="mt-4 text-[1rem] leading-relaxed text-white/80">
                {evento.fecha} · 09:00 – 14:30 h · Oviedo
              </p>
              <a
                href={evento.inscripcion}
                target="_blank"
                rel="noopener"
                className="press group mt-7 inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3.5 text-[0.95rem] font-bold text-navy hover:bg-blush"
              >
                Reservar plaza gratis
                <span
                  className="text-[1.05rem] leading-none transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  &rarr;
                </span>
              </a>
            </div>

            <div>
              <p className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-white/55 lg:text-right">
                Organiza
              </p>
              <div className="mt-4 flex items-center gap-6 sm:gap-8 lg:justify-end">
                <img
                  src="/brand/novagob.png"
                  alt="Fundación NovaGob"
                  className="h-9 w-auto sm:h-10"
                />
                <span className="h-9 w-px bg-white/25" aria-hidden="true" />
                <img
                  src="/brand/asturias.png"
                  alt="Principado de Asturias"
                  className="h-10 w-auto sm:h-11"
                />
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/12 pt-6">
            <a
              href="https://novagob.org"
              target="_blank"
              rel="noopener"
              className="text-[0.8125rem] text-white/55 transition-colors hover:text-white"
            >
              © {new Date().getFullYear()} Fundación NovaGob
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
