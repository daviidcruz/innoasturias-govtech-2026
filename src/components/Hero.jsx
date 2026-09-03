import { evento } from '../data/content.js'

/**
 * Portada. Ocupa una ventana exacta: la tarjeta de cristal se estira con el
 * hueco libre y los espacios internos van limitados con min(rem, vh), así que
 * en pantallas bajas se comprimen en vez de recortarse.
 */
export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col px-3 pb-3 pt-[6rem] sm:px-5 sm:pb-5 sm:pt-[6.75rem]"
    >
      <div className="anim-plate glass-1 relative mx-auto flex w-full max-w-[84rem] flex-1 flex-col rounded-panel px-6 py-[min(2.5rem,4vh)] sm:rounded-plate sm:px-9 lg:px-14">
        <div className="flex items-start justify-between gap-6">
          <span className="text-[clamp(1.75rem,min(4vw,5.5vh),3.75rem)] font-extrabold leading-none tracking-[-0.03em] text-white">
            2026
          </span>
          <img
            src="/brand/rays.png"
            alt=""
            className="h-[clamp(3rem,min(8vw,15vh),12rem)] w-auto"
          />
        </div>

        <div className="mt-auto">
          {/* La entrada es gratuita: es lo primero que tiene que quedar claro */}
          <div className="anim-step mb-[min(1.25rem,2vh)] flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-mint/95 px-3.5 py-1.5 text-[0.6875rem] font-extrabold uppercase tracking-[0.15em] text-ink">
              {evento.entrada}
            </span>
            <span className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.15em] text-white/85">
              {evento.plazas}
            </span>
          </div>

          <h1 className="anim-wordmark text-[clamp(2.25rem,min(9vw,13vh),8rem)] font-extrabold leading-[0.88] tracking-[-0.038em] text-white">
            InnoAsturias
          </h1>
          <p className="anim-step mt-[0.12em] text-[clamp(1.15rem,min(3.8vw,5.5vh),3rem)] font-light leading-none tracking-[-0.02em] text-white/80 [animation-delay:0.5s]">
            GovTech
          </p>

          <p className="anim-step mt-[min(1.5rem,2.4vh)] max-w-[52ch] text-[clamp(0.95rem,1.15vw,1.15rem)] leading-relaxed text-white/85 [animation-delay:0.62s]">
            {evento.claim}
          </p>

          <div className="anim-step mt-[min(1.6rem,2.5vh)] flex flex-wrap items-center gap-3 [animation-delay:0.72s]">
            <a
              href={evento.inscripcion}
              target="_blank"
              rel="noopener"
              className="press group inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3.5 text-[0.95rem] font-bold text-navy hover:bg-blush"
            >
              Reservar plaza gratis
              <span
                className="text-[1.05rem] leading-none transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              >
                &rarr;
              </span>
            </a>
            <a
              href="#programa"
              className="press rounded-full border border-white/40 px-7 py-3.5 text-[0.95rem] font-semibold text-white transition-colors hover:border-white hover:bg-white/12"
            >
              Ver el programa
            </a>
          </div>
        </div>

        {/* Organizan: los dos logos juntos, no repartidos a los extremos */}
        <div className="anim-step mt-[min(2rem,3vh)] flex flex-wrap items-center gap-x-7 gap-y-4 border-t border-white/20 pt-[min(1.25rem,2vh)] [animation-delay:0.82s]">
          <span className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-white/60">
            Organiza
          </span>
          <div className="flex items-center gap-6 sm:gap-8">
            <img
              src="/brand/novagob.png"
              alt="Fundación NovaGob"
              className="h-[clamp(2.15rem,4.6vh,3.5rem)] w-auto"
            />
            <span className="h-9 w-px bg-white/25" aria-hidden="true" />
            <img
              src="/brand/asturias.png"
              alt="Principado de Asturias"
              className="h-[clamp(2.4rem,5.1vh,3.9rem)] w-auto"
            />
          </div>
        </div>
      </div>

    </section>
  )
}
