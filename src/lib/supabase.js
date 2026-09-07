import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Falla alto y claro en vez de dejar que cada fetch explote con un 401
  // críptico: sin estas dos variables el Radar no puede leer ni escribir.
  console.error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Copia .env.example a .env.local (o configúralas en Vercel) con la clave PUBLICABLE, nunca la secreta.',
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '')
