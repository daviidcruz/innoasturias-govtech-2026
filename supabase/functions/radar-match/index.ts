// radar-match — Edge Function del Radar del ecosistema.
//
// La dispara un trigger de base de datos (ver la migración
// 20260926_radar_matches.sql) en cada INSERT de radar_respuestas, y además
// un aviso de pg_cron cada minuto como red de seguridad (ver la migración
// 20260927_radar_cola_fifo.sql). En ambos casos el cuerpo de la petición
// se ignora — esta función no procesa "la fila que la disparó", procesa
// la cola entera desde el principio, en el orden real de llegada.
//
// Por qué una cola y no una llamada a Groq por envío en paralelo: antes
// cada envío disparaba su propia llamada a Groq a la vez que todos los
// demás — probado en directo, con 70 envíos casi simultáneos muchas
// llamadas competían por el mismo cupo de tokens/minuto y se quedaban sin
// cupo pese a reintentar. Se descartó también un "plan B" por palabras
// clave para esos casos: no puede explicar el POR QUÉ del match, y esa
// frase es justo lo que necesita la presentadora del evento para leerla en
// voz alta. La solución real es evitar la avalancha desde el origen: cada
// envío se limita a APUNTARSE en la cola (columna `procesado_en`), y solo
// un proceso a la vez llama a Groq, en estricto orden de llegada — así
// nunca hay dos llamadas compitiendo por el mismo cupo. El resultado es
// siempre una decisión real de la IA, con su explicación; lo único que
// cambia con carga alta es cuánto se tarda en llegar a cada una, nunca la
// calidad del match.
//
// Requiere el secret GROQ_API_KEY configurado en el proyecto (Project
// Settings → Edge Functions → Secrets) — y, opcionalmente, GROQ_API_KEY_2,
// GROQ_API_KEY_3... como cuentas de respaldo (ver `obtenerClaves`, más
// abajo) para multiplicar el cupo de tokens/minuto disponible. SUPABASE_URL
// y SUPABASE_SERVICE_ROLE_KEY los inyecta el propio runtime de Supabase.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const GROQ_MODEL = 'openai/gpt-oss-120b'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

/** Todas las claves de Groq configuradas, en orden: GROQ_API_KEY primero,
 *  luego GROQ_API_KEY_2, GROQ_API_KEY_3... hasta la primera que no exista.
 *  Cada cuenta gratuita adicional suma otros 8000 tokens/minuto al cupo
 *  combinado — con la cola, ese cupo ya no se reparte entre llamadas que
 *  compiten a la vez, así que rinde mucho más que antes. */
function obtenerClaves(): string[] {
  const claves: string[] = []
  const primera = Deno.env.get('GROQ_API_KEY')
  if (primera) claves.push(primera)
  for (let i = 2; i <= 9; i++) {
    const extra = Deno.env.get(`GROQ_API_KEY_${i}`)
    if (extra) claves.push(extra)
  }
  return claves
}

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Una sola llamada al modelo por respuesta, con todas las candidatas del
 * lado contrario dentro — el elemento fijo (`central`) hace de reto o de
 * solución según `centralEsReto`, y el prompt se redacta acorde. Como la
 * cola garantiza que solo hay una llamada en curso a la vez, los
 * reintentos aquí son solo para fallos genuinos de Groq (no para una
 * avalancha de llamadas compitiendo entre sí, que ya no puede pasar).
 */
async function preguntarAlModelo(central: any, candidatos: any[], centralEsReto: boolean) {
  const claves = obtenerClaves()
  if (claves.length === 0) {
    console.error('radar-match: falta el secret GROQ_API_KEY')
    return null
  }

  const lista = candidatos
    .map((c, i) => `${i + 1}. id="${c.id}" — "${c.necesidad_oferta}"`)
    .join('\n')

  const bloqueFijo = centralEsReto
    ? `Reto planteado:\n"${central.necesidad_oferta}"`
    : `Solución ofrecida:\n"${central.necesidad_oferta}"`
  const bloqueCandidatos = centralEsReto
    ? `Soluciones candidatas (son todas las que todavía no tienen pareja — la categoría o área que marcó cada una en el formulario es solo una etiqueta orientativa, ignórala si el contenido dice otra cosa: lo que importa es el objetivo real de cada una, no la casilla que marcaron):\n${lista}`
    : `Retos candidatos (son todos los que todavía no tienen pareja — la categoría o área que marcó cada uno en el formulario es solo una etiqueta orientativa, ignórala si el contenido dice otra cosa: lo que importa es el objetivo real de cada uno, no la casilla que marcaron):\n${lista}`

  const prompt = `Eres quien decide, en el Radar del ecosistema GovTech, si una solución propuesta por alguien podría ayudar de verdad a resolver un reto planteado por otra persona (puede ser una Administración, una empresa, una startup o una universidad — cualquiera puede traer un reto o una solución, no va ligado a quién es).

No exijas que la solución mencione el reto casi palabra por palabra — acepta también una relación indirecta o parcial, siempre que tenga sentido lógico y sea plausible en la práctica: piensa en lo que esa capacidad permite hacer, no solo en el texto literal. Ejemplos de este criterio, ni muy laxo ni muy estricto:
- Reto "anonimizar documentos" + solución "protección de datos" → SÍ encaja: anonimizar es una técnica dentro de proteger datos, es coherente que quien ofrece protección de datos pueda anonimizar documentos.
- Reto "obtener datos" + solución "despliegue de IA" → SÍ encaja: desplegar IA habilita automatizaciones, búsquedas y procesado que sirven para obtener datos — es una vía razonable, aunque no sea la única lectura posible.
- Reto "limpiar cristales" + solución "fabricar cristal desde cero" → NO encaja: aunque comparten la palabra "cristal", son capacidades distintas (limpiar no es fabricar) — el parecido es solo superficial, no lógico.

En resumen: acepta la relación si, pensando un momento en qué permite hacer esa solución, un profesional razonable diría "sí, esto puede servir para eso" — aunque sea de forma parcial o indirecta. Recházala solo si la capacidad de fondo es realmente distinta, no solo porque el texto no coincida palabra por palabra.

${bloqueFijo}

${bloqueCandidatos}

Si UNA de las candidatas encaja según ese criterio, responde solo con este JSON, sin nada más alrededor:
{"id": "<el id de esa candidata>", "explicacion": "<una frase breve, en español, explicando por qué encajan>"}

Si ninguna encaja ni siquiera de forma indirecta y coherente, responde exactamente:
{"id": null, "explicacion": null}`

  const cuerpo = JSON.stringify({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  })

  const llamarConClave = (clave: string) =>
    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clave}` },
      body: cuerpo,
    })

  // Una clave tras otra, la primera que no dé 429 se queda con la
  // respuesta. Si TODAS dan 429 (cupo combinado agotado de verdad, no por
  // colisión con otra llamada — eso ya no puede pasar con la cola), se
  // reintenta unas pocas veces esperando lo que Groq sugiera.
  const MAX_VUELTAS = 4
  let resp: Response | null = null
  for (let vuelta = 0; vuelta < MAX_VUELTAS && !resp; vuelta++) {
    let ultimoLimitado: Response | null = null
    for (const clave of claves) {
      const intento = await llamarConClave(clave)
      if (intento.status !== 429) {
        resp = intento
        break
      }
      ultimoLimitado = intento
    }
    if (resp || !ultimoLimitado) break
    if (vuelta < MAX_VUELTAS - 1) {
      const cuerpoError = await ultimoLimitado.clone().text()
      const sugerido = Number(cuerpoError.match(/try again in ([\d.]+)s/)?.[1] ?? '4')
      const espera = Math.min(sugerido, 15) + Math.random() * 3
      console.error(
        `radar-match: todas las claves al límite (vuelta ${vuelta + 1}/${MAX_VUELTAS}), reintentando en`,
        espera.toFixed(1),
        's',
      )
      await esperar(espera * 1000)
    } else {
      resp = ultimoLimitado
    }
  }

  if (!resp || !resp.ok) {
    console.error('radar-match: Groq respondió', resp?.status, await resp?.text())
    return null
  }

  const data = await resp.json()
  try {
    const contenido = JSON.parse(data.choices[0].message.content)
    if (!contenido.id) return null
    const candidata = candidatos.find((c) => c.id === contenido.id)
    if (!candidata || !contenido.explicacion) return null
    return { candidataId: candidata.id, explicacion: String(contenido.explicacion) }
  } catch (err) {
    console.error('radar-match: no se pudo interpretar la respuesta del modelo', err, data)
    return null
  }
}

/** Procesa una respuesta ya reclamada de la cola: busca candidatas del
 *  lado contrario, le pregunta al modelo y guarda el match si lo hay.
 *  Nunca lanza — cualquier fallo se registra y esa respuesta se queda sin
 *  match esta vez (sigue disponible como candidata para futuras llegadas). */
async function procesarUna(fila: any) {
  const esReto = fila.tipo === 'reto'

  // Se piden más de las que hacen falta (LIMITE_CANDIDATAS de sobra) para
  // poder descartar después las que ya tengan pareja y aun así quedarnos
  // con el límite real completo.
  const LIMITE_CANDIDATAS = 15
  const { data: candidatasBrutas, error } = await supabase
    .from('radar_respuestas')
    .select('id, necesidad_oferta, areas')
    .neq('id', fila.id)
    .eq('tipo', esReto ? 'solucion' : 'reto')
    .order('creado_en', { ascending: false })
    .limit(LIMITE_CANDIDATAS * 3)

  if (error) {
    console.error('radar-match: error leyendo candidatas', error)
    return
  }

  // Todas las que todavía no tengan pareja — sin filtrar por área. El área
  // es una casilla que marca la propia persona en el formulario, no
  // siempre refleja bien el contenido real; decidirlo solo por contenido
  // es cosa del modelo, no de una coincidencia de checkbox.
  //
  // El número de candidatas está acotado (LIMITE_CANDIDATAS, las más
  // recientes primero) porque el coste en tokens de la llamada a Groq
  // crece con la lista — probado en directo: sin límite, con muchas
  // respuestas sin pareja aún, una sola llamada podía llevar hasta 35
  // candidatas y costar 2500-3000 tokens en vez de los ~900-1300 de antes.
  const { data: yaEmparejadas } = await supabase.from('radar_matches').select('reto_id, solucion_id')
  const idsOcupados = new Set((yaEmparejadas ?? []).flatMap((m) => [m.reto_id, m.solucion_id]))
  const candidatas = (candidatasBrutas ?? [])
    .filter((c) => !idsOcupados.has(c.id))
    .slice(0, LIMITE_CANDIDATAS)
  if (candidatas.length === 0) return

  const r = await preguntarAlModelo(fila, candidatas, esReto)
  if (!r) return

  const matchFinal = esReto
    ? { reto_id: fila.id, solucion_id: r.candidataId, explicacion: r.explicacion }
    : { reto_id: r.candidataId, solucion_id: fila.id, explicacion: r.explicacion }

  const { error: errorInsert } = await supabase.from('radar_matches').insert(matchFinal)
  if (errorInsert && errorInsert.code !== '23505') {
    // 23505 (conflicto de clave) no es un fallo real — es la garantía 1:1
    // haciendo su trabajo, por si acaso esta fila se emparejó por otra vía
    // mientras tanto.
    console.error('radar-match: error guardando el match', errorInsert)
  }
}

// Tope de tiempo por invocación: hay que dejar margen de sobra respecto al
// límite de ejecución de una Edge Function (unos minutos) para poder
// liberar el turno con calma antes de que la plataforma corte en seco. Si
// queda cola por procesar al llegar a este tope, la siguiente invocación
// (el próximo envío, o el aviso de pg_cron del minuto siguiente) continúa
// justo donde se quedó — nada se pierde, solo se reparte en más de una
// tanda.
const TIEMPO_MAXIMO_MS = 100_000

Deno.serve(async (_req) => {
  // Un único trabajador a la vez: si el turno ya lo tiene otra invocación
  // (un envío casi simultáneo, o el aviso de pg_cron solapándose), esta
  // sale sin hacer nada — quien tiene el turno ya se encargará de toda la
  // cola, incluida esta respuesta, en su propio turno de reclamar.
  const { data: turnoConseguido, error: errorTurno } = await supabase.rpc('radar_tomar_turno')
  if (errorTurno) {
    console.error('radar-match: error al pedir el turno', errorTurno)
    return new Response('error al pedir el turno', { status: 500 })
  }
  if (!turnoConseguido) {
    return new Response('turno ocupado, nada que hacer', { status: 200 })
  }

  const inicio = Date.now()
  let procesadas = 0
  try {
    while (Date.now() - inicio < TIEMPO_MAXIMO_MS) {
      const { data: fila, error: errorReclamar } = await supabase.rpc('radar_reclamar_siguiente')
      if (errorReclamar) {
        console.error('radar-match: error reclamando de la cola', errorReclamar)
        break
      }
      if (!fila || !fila.id) break // cola vacía

      await procesarUna(fila)
      procesadas++
    }
  } finally {
    const { error: errorLiberar } = await supabase.rpc('radar_liberar_turno')
    if (errorLiberar) console.error('radar-match: error liberando el turno', errorLiberar)
  }

  return new Response(`cola procesada: ${procesadas}`, { status: 200 })
})
