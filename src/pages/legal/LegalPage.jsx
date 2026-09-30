import { Link } from 'react-router-dom'
import Backdrop from '../../components/Backdrop.jsx'

/**
 * Armazón compartido por /privacidad y /terminos-y-condiciones: mismo
 * fondo, mismo panel de cristal, mismo ancho de lectura. El contenido de
 * cada una (las secciones concretas) vive en su propio archivo.
 */
export default function LegalPage({ titulo, actualizado, children }) {
  return (
    <div className="relative min-h-screen px-5 py-14 sm:px-8 sm:py-20">
      <Backdrop />

      <div className="mx-auto max-w-[52rem]">
        <Link
          to="/"
          className="press inline-flex items-center gap-2 text-[0.8125rem] font-semibold text-white/70 transition-colors hover:text-white"
        >
          <span aria-hidden="true">&larr;</span> InnoAsturias GovTech 2026
        </Link>

        <div className="glass-1 mt-8 rounded-plate p-7 sm:p-10">
          <h1 className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-extrabold leading-tight tracking-[-0.03em] text-white">
            {titulo}
          </h1>
          <p className="mt-2 text-[0.8125rem] text-white/50">Última actualización: {actualizado}</p>

          <div className="legal-body mt-8 max-w-none text-[0.9375rem] leading-[1.7] text-white/75">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
