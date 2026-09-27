import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'

/**
 * Los matches del Radar (tabla `radar_matches`, decididos por la Edge
 * Function con IA) — se cargan al montar y se escuchan en directo. Antes
 * vivía solo dentro de `RadarGraph`; se ha sacado a un hook aparte para que
 * `RadarPantalla` también pueda leerlos (para el carrusel de "pendientes"),
 * sin que `RadarGraph` deje de ser quien decide cómo dibujarlos.
 */
export function useMatches() {
  const [matches, setMatches] = useState([])

  useEffect(() => {
    let activo = true
    supabase
      .from('radar_matches')
      .select('reto_id, solucion_id, explicacion, creado_en')
      .then(({ data, error }) => {
        if (!activo) return
        if (error) {
          console.error('Radar: error al cargar los matches', error)
          return
        }
        setMatches(data ?? [])
      })

    const canal = supabase
      .channel('radar_matches_en_vivo')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'radar_matches' },
        (payload) => {
          setMatches((prev) => (prev.some((m) => m.reto_id === payload.new.reto_id) ? prev : [...prev, payload.new]))
        },
      )
      .subscribe()

    return () => {
      activo = false
      supabase.removeChannel(canal)
    }
  }, [])

  return matches
}

/**
 * Qué tarjetas ya se han comentado en directo (tabla `radar_vistos`) — se
 * carga al montar, se escucha en directo, y `marcar` deja constancia de una
 * nueva tanda: optimista en pantalla (no espera a Supabase para quitar el
 * punto de "sin abrir") y persistido en segundo plano. `ignoreDuplicates`
 * hace que volver a marcar algo ya visto no falle por su clave repetida.
 */
export function useVistos() {
  const [vistos, setVistos] = useState(() => new Set())

  useEffect(() => {
    let activo = true
    supabase
      .from('radar_vistos')
      .select('respuesta_id')
      .then(({ data, error }) => {
        if (!activo) return
        if (error) {
          console.error('Radar: error al cargar lo ya comentado', error)
          return
        }
        setVistos(new Set((data ?? []).map((r) => r.respuesta_id)))
      })

    const canal = supabase
      .channel('radar_vistos_en_vivo')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'radar_vistos' },
        (payload) => {
          setVistos((prev) => (prev.has(payload.new.respuesta_id) ? prev : new Set(prev).add(payload.new.respuesta_id)))
        },
      )
      .subscribe()

    return () => {
      activo = false
      supabase.removeChannel(canal)
    }
  }, [])

  const marcar = (ids) => {
    const nuevos = ids.filter((id) => !vistos.has(id))
    if (nuevos.length === 0) return

    setVistos((prev) => {
      const siguiente = new Set(prev)
      nuevos.forEach((n) => siguiente.add(n))
      return siguiente
    })

    supabase
      .from('radar_vistos')
      .upsert(
        nuevos.map((respuesta_id) => ({ respuesta_id })),
        { onConflict: 'respuesta_id', ignoreDuplicates: true },
      )
      .then(({ error }) => {
        if (error) console.error('Radar: error al marcar como comentado', error)
      })
  }

  return { vistos, marcar }
}
