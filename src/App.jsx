import { Suspense, lazy } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'

// El Radar carga Supabase y Framer Motion — de lejos lo más pesado del
// bundle. Quien solo visita la portada del evento (la inmensa mayoría) no
// tiene por qué descargarlo; se pide solo al entrar en /radar/*.
const RadarForm = lazy(() => import('./pages/radar/RadarForm.jsx'))
const RadarPantalla = lazy(() => import('./pages/radar/RadarPantalla.jsx'))
const RadarResultados = lazy(() => import('./pages/radar/RadarResultados.jsx'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/radar" element={<RadarForm />} />
          <Route path="/radar/pantalla" element={<RadarPantalla />} />
          <Route path="/radar/resultados" element={<RadarResultados />} />
        </Routes>
      </Suspense>
      <Analytics />
    </BrowserRouter>
  )
}
