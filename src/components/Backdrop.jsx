/**
 * Fondo único de toda la página: la imagen original de Canva, fija.
 * No se mueve con el scroll, así que el contenido parece flotar sobre el
 * cartel. El velo es lo que permite texto blanco encima con contraste.
 */
export default function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-teal via-navy to-ink" />

      <img
        src="/brand/back.webp"
        alt=""
        fetchpriority="high"
        className="absolute inset-0 h-full w-full scale-105 object-cover"
      />

      {/* Un velo diagonal hacia la izquierda —donde vive el texto— y un
          viñeteado suave en los bordes. Sin una capa plana encima: la foto
          conserva su brillo y su color en el resto del cartel. */}
      <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(6,15,34,0.5)_0%,rgba(6,15,34,0.16)_46%,rgba(6,15,34,0)_78%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(130%_95%_at_50%_4%,transparent_46%,rgba(6,15,34,0.4)_100%)]" />
    </div>
  )
}
