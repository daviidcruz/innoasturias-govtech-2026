import Backdrop from '../components/Backdrop.jsx'
import Nav from '../components/Nav.jsx'
import Hero from '../components/Hero.jsx'
// Radar (la sección "Cuatro mundos" de la landing) se renombra al importar:
// el nombre ya lo usa el Radar del ecosistema de /radar, que es una
// herramienta completamente distinta, no la misma sección con otro nombre.
import { CuentaAtras, Encuentro, Jornada, Radar as RadarSection, Footer } from '../components/Sections.jsx'
import { useHashLanding } from '../hooks/useHashLanding.js'

export default function Home() {
  useHashLanding()

  return (
    <>
      <Backdrop />
      <Nav />
      <main>
        <Hero />
        <CuentaAtras />
        <Encuentro />
        <Jornada />
        <RadarSection />
      </main>
      <Footer />
    </>
  )
}
