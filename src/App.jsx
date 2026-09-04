import { Analytics } from '@vercel/analytics/react'
import Backdrop from './components/Backdrop.jsx'
import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import { CuentaAtras, Encuentro, Jornada, Radar, Footer } from './components/Sections.jsx'
import { useHashLanding } from './hooks/useHashLanding.js'

export default function App() {
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
        <Radar />
      </main>
      <Footer />
      <Analytics />
    </>
  )
}
