import { useEffect, useRef, useState } from 'react'
import { nav, evento } from '../data/content.js'

/** Menú flotante: píldora translúcida alargada, nunca una barra negra. */
export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')
  const [indicator, setIndicator] = useState(null)
  const navRef = useRef(null)
  const linkRefs = useRef({})

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Marca en el menú la sección que se está leyendo
  useEffect(() => {
    const sections = nav.map((i) => document.getElementById(i.id)).filter(Boolean)
    if (!sections.length || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])

  // La píldora del enlace activo se desliza en vez de aparecer y desaparecer
  useEffect(() => {
    const medir = () => {
      const el = linkRefs.current[active]
      const nav = navRef.current
      if (!el || !nav) return
      const a = el.getBoundingClientRect()
      const b = nav.getBoundingClientRect()
      setIndicator({ left: a.left - b.left, width: a.width })
    }
    medir()
    // El contenedor cambia de ancho al encogerse (500ms): se vuelve a medir
    // al terminar esa transición, y también al redimensionar la ventana.
    const t = setTimeout(medir, 520)
    window.addEventListener('resize', medir)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', medir)
    }
  }, [active, scrolled])

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div
        className={`glass-2 mx-auto flex items-center gap-3 rounded-full transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${
          scrolled
            ? 'glass-2--dim max-w-[72rem] py-2 pl-4 pr-2 sm:pl-5'
            : 'max-w-[84rem] py-2.5 pl-5 pr-2.5 sm:pl-6'
        }`}
      >
        <a href="#top" className="press flex shrink-0 items-center gap-2.5 rounded-full">
          <img
            src="/brand/rays.png"
            alt=""
            className="h-6 w-auto opacity-90 transition-transform duration-500 hover:rotate-90"
          />
          <span className="text-[14.5px] font-bold tracking-tight text-white">
            InnoAsturias <span className="font-light text-white/55">GovTech</span>
          </span>
        </a>

        <nav ref={navRef} className="relative mx-auto hidden items-center lg:flex">
          {/* Píldora deslizante detrás del enlace activo */}
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-1 rounded-full bg-white/15 transition-[left,width,opacity] duration-400 ease-[cubic-bezier(.16,1,.3,1)] ${
              indicator ? 'opacity-100' : 'opacity-0'
            }`}
            style={indicator ? { left: indicator.left, width: indicator.width } : undefined}
          />
          {nav.map((i) => (
            <a
              key={i.id}
              ref={(el) => {
                linkRefs.current[i.id] = el
              }}
              href={`#${i.id}`}
              aria-current={active === i.id ? 'true' : undefined}
              className={`relative rounded-full px-4 py-2 text-[13.5px] transition-colors duration-300 ${
                active === i.id ? 'font-semibold text-white' : 'text-white/65 hover:text-white'
              }`}
            >
              {i.label}
            </a>
          ))}
        </nav>

        <a
          href={evento.inscripcion}
          target="_blank"
          rel="noopener"
          className="press ml-auto hidden shrink-0 items-center gap-2 rounded-full bg-white py-2.5 pl-5 pr-4 text-[13.5px] font-bold text-navy hover:bg-blush lg:ml-0 lg:flex"
        >
          Reservar gratis
          <span className="text-[15px] leading-none" aria-hidden="true">
            &rarr;
          </span>
        </a>

        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          className="ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/20 text-white lg:hidden"
        >
          <span className="relative block h-3.5 w-4">
            <span
              className={`absolute left-0 h-[1.5px] w-full bg-current transition-all duration-300 ${open ? 'top-1.5 rotate-45' : 'top-0'}`}
            />
            <span
              className={`absolute left-0 top-1.5 h-[1.5px] w-full bg-current transition-opacity duration-200 ${open ? 'opacity-0' : ''}`}
            />
            <span
              className={`absolute left-0 h-[1.5px] w-full bg-current transition-all duration-300 ${open ? 'top-1.5 -rotate-45' : 'top-3'}`}
            />
          </span>
        </button>
      </div>

      <div
        className={`mx-auto mt-2 overflow-hidden rounded-[1.75rem] transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)] lg:hidden ${
          open ? 'glass-2 max-h-96 opacity-100' : 'pointer-events-none max-h-0 opacity-0'
        }`}
      >
        <div className="p-3">
          {nav.map((i) => (
            <a
              key={i.id}
              href={`#${i.id}`}
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 text-[15px] text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              {i.label}
            </a>
          ))}
          <a
            href={evento.inscripcion}
            target="_blank"
            rel="noopener"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-full bg-white px-5 py-3.5 text-center text-[15px] font-bold text-navy"
          >
            Reservar plaza gratis
          </a>
        </div>
      </div>
    </header>
  )
}
