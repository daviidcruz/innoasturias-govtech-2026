import { useEffect } from 'react'
import { createPortal } from 'react-dom'

/**
 * Visor de fotos a pantalla completa. Va en un portal a <body>: los bloques
 * de la portada se revelan con `transform`, y un `position: fixed` dentro de
 * un ancestro transformado deja de ser relativo a la ventana.
 */
export default function Visor({ fotos, indice, onCambia, onCierra }) {
  const total = fotos.length
  const foto = fotos[indice]

  useEffect(() => {
    const alTeclado = (e) => {
      if (e.key === 'Escape') onCierra()
      else if (e.key === 'ArrowRight') onCambia((indice + 1) % total)
      else if (e.key === 'ArrowLeft') onCambia((indice - 1 + total) % total)
    }
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', alTeclado)
    return () => {
      document.body.style.overflow = overflowPrevio
      window.removeEventListener('keydown', alTeclado)
    }
  }, [indice, total, onCambia, onCierra])

  const boton =
    'press grid h-12 w-12 place-items-center rounded-full bg-white/10 text-[1.4rem] font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20'

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Galería de fotos de la jornada"
      onClick={onCierra}
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-ink/95 px-4 py-6 backdrop-blur-sm"
    >
      <img
        key={foto.src}
        src={foto.src}
        alt={foto.alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] max-w-full rounded-card object-contain shadow-2xl"
      />

      <div className="mt-5 flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-label="Foto anterior"
          onClick={() => onCambia((indice - 1 + total) % total)}
          className={boton}
        >
          ‹
        </button>
        <span className="tnum min-w-[4.5rem] text-center text-[0.875rem] font-bold text-white/80">
          {indice + 1} / {total}
        </span>
        <button
          type="button"
          aria-label="Foto siguiente"
          onClick={() => onCambia((indice + 1) % total)}
          className={boton}
        >
          ›
        </button>
      </div>

      <button
        type="button"
        autoFocus
        aria-label="Cerrar galería"
        onClick={(e) => {
          e.stopPropagation()
          onCierra()
        }}
        className={`${boton} absolute right-4 top-4 sm:right-6 sm:top-6`}
      >
        ✕
      </button>
    </div>,
    document.body,
  )
}
