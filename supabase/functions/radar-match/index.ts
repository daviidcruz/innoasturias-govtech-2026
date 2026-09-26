// radar-match — Edge Function del Radar del ecosistema.
//
// La dispara un trigger de base de datos (ver la migración
// 20260926_radar_matches.sql) en cada INSERT de radar_respuestas. Antes el
// match se calculaba en el navegador, solo por área compartida (checkbox
// del formulario) — así dos respuestas sin relación real quedaban unidas
// por llevar la misma etiqueta. Aquí, en cambio, se le pasa el texto real
// del reto y de la(s) solución(es) candidata(s) a un modelo de lenguaje
// (Groq) y solo se guarda un match si el modelo dice que de verdad
// resuelve el problema — con una frase explicando por qué. Sin match
// genuino, no se fuerza nada: la respuesta se queda suelta.
//
// Requiere el secret GROQ_API_KEY configurado en el proyecto (Project
// Settings → Edge Functions → Secrets) — y, opcionalmente, GROQ_API_KEY_2,
// GROQ_API_KEY_3... como cuentas de respaldo (ver `obtenerClaves`, más
// abajo) para cuando la primera se quede sin cupo de tokens en plena
// avalancha de envíos. SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los
// inyecta el propio runtime de Supabase, no hace falta configurarlos.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const GROQ_MODEL = 'openai/gpt-oss-120b'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

/** Todas las claves de Groq configuradas, en orden: GROQ_API_KEY primero,
 *  luego GROQ_API_KEY_2, GROQ_API_KEY_3... hasta la primera que no exista.
 *  Con una sola clave gratuita (8000 tokens/minuto) una avalancha de
 *  envíos casi simultáneos agota el cupo enseguida — probado en directo:
 *  con 29 respuestas en 2 minutos ya saltaban errores 429. Cada cuenta
 *  gratuita adicional multiplica ese cupo sin coste. */
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
 * Una sola llamada al modelo por respuesta nueva, venga de donde venga —
 * nunca una por cada candidata. Con la clave actual (8000 tokens/minuto,
 * ~900 por llamada) el bucle de antes podía disparar una llamada por cada
 * reto suelto al llegar una sola solución: con varias personas enviando
 * casi a la vez, eso agotaba el minuto de tokens enseguida. Aquí siempre
 * se le pasa al modelo la lista ENTERA de candidatas del lado contrario de
 * una vez, y elige como mucho una — el elemento fijo (`central`) hace de
 * reto o de solución según `centralEsReto`, y el prompt se redacta acorde.
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

  // Una clave tras otra, la primera que no dé 429 (límite de tokens
  // superado) se queda con la respuesta. Si TODAS dan 429, no se rinde a
  // la primera — probado en directo: con 70 avalanchas en el mismo
  // instante, esperar siempre el mismo tiempo (el que sugiere Groq) hacía
  // que todas reintentaran juntas otra vez y volvieran a chocar. Por eso
  // cada intento añade un poco de aleatoriedad a la espera — para que
  // dejen de ir sincronizadas y se vayan repartiendo solas — y hay varias
  // rondas, no solo una.
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
      const jitter = Math.random() * 6
      const espera = Math.min(sugerido, 20) + jitter
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

Deno.serve(async (req) => {
  try {
    const { record } = await req.json()
    if (!record?.id || !record?.tipo) {
      return new Response('sin registro', { status: 400 })
    }

    // Por si el trigger llegara a dispararse dos veces para la misma fila
    // (no debería, pero es una llamada barata de comprobar antes de gastar
    // una consulta al modelo).
    const { data: yaExiste } = await supabase
      .from('radar_matches')
      .select('reto_id')
      .or(`reto_id.eq.${record.id},solucion_id.eq.${record.id}`)
      .maybeSingle()
    if (yaExiste) return new Response('ya tenía match', { status: 200 })

    // Quién trae el reto y quién la solución ya no depende del perfil (una
    // empresa también puede tener un reto) — depende de lo que la propia
    // persona eligió en el formulario.
    const esReto = record.tipo === 'reto'

    const { data: candidatasBrutas, error } = await supabase
      .from('radar_respuestas')
      .select('id, necesidad_oferta, areas')
      .neq('id', record.id)
      .eq('tipo', esReto ? 'solucion' : 'reto')

    if (error) {
      console.error('radar-match: error leyendo candidatas', error)
      return new Response('error leyendo candidatas', { status: 500 })
    }

    // Todas las que todavía no tengan pareja — sin filtrar por área. El área
    // es una casilla que marca la propia persona en el formulario, no
    // siempre refleja bien el contenido real (dos respuestas que sí encajan
    // pueden llevar áreas distintas, y al revés); decidirlo solo por
    // contenido es cosa del modelo, no de una coincidencia de checkbox.
    const { data: yaEmparejadas } = await supabase.from('radar_matches').select('reto_id, solucion_id')
    const idsOcupados = new Set((yaEmparejadas ?? []).flatMap((m) => [m.reto_id, m.solucion_id]))
    const candidatas = (candidatasBrutas ?? []).filter((c) => !idsOcupados.has(c.id))
    if (candidatas.length === 0) return new Response('sin candidatas', { status: 200 })

    // Una sola llamada, con todas las candidatas dentro — nunca una por
    // candidata (ver el porqué en `preguntarAlModelo`).
    const r = await preguntarAlModelo(record, candidatas, esReto)
    const matchFinal = r
      ? esReto
        ? { retoId: record.id, solucionId: r.candidataId, explicacion: r.explicacion }
        : { retoId: r.candidataId, solucionId: record.id, explicacion: r.explicacion }
      : null

    if (!matchFinal) return new Response('sin match', { status: 200 })

    const { error: errorInsert } = await supabase.from('radar_matches').insert({
      reto_id: matchFinal.retoId,
      solucion_id: matchFinal.solucionId,
      explicacion: matchFinal.explicacion,
    })
    if (errorInsert) {
      // Conflicto de clave (alguien más ya lo emparejó mientras tanto) no es
      // un fallo real — es exactamente la garantía 1:1 haciendo su trabajo.
      if (errorInsert.code !== '23505') {
        console.error('radar-match: error guardando el match', errorInsert)
        return new Response('error guardando el match', { status: 500 })
      }
    }

    return new Response('match guardado', { status: 200 })
  } catch (err) {
    console.error('radar-match: error inesperado', err)
    return new Response('error inesperado', { status: 500 })
  }
})
