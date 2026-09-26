/**
 * Configuración del Radar del ecosistema: perfiles y áreas, con sus
 * etiquetas, colores y textos exactos. Única fuente de verdad — el
 * formulario, la pantalla en vivo y los resultados leen de aquí, así que
 * cambiar un texto o un color se hace en un solo sitio.
 */

// Los cuatro valores exactos que acepta la columna `perfil` en Supabase.
// La especificación dejaba abierto fusionar Empresa/Startup en un botón;
// se mantienen separados: son dos realidades distintas (una empresa
// consolidada no es lo mismo que una startup) y la tabla ya lo permite,
// así que perderlo habría sido tirar información sin necesidad.
export const PERFILES = {
  administracion: {
    label: 'Administración',
    corto: 'Administración',
    color: 'var(--color-azure)',
  },
  empresa: {
    label: 'Empresa',
    corto: 'Empresa',
    color: 'var(--color-coral)',
  },
  startup: {
    label: 'Startup',
    corto: 'Startup',
    color: 'var(--color-mint)',
  },
  universidad: {
    label: 'Universidad / centro de investigación',
    corto: 'Universidad',
    color: 'var(--color-lilac)',
  },
}

export const ORDEN_PERFILES = ['administracion', 'empresa', 'startup', 'universidad']

// Los valores exactos que acepta la columna `areas` (array: una respuesta
// puede tocar más de una). Ampliado desde las seis iniciales — quedaban
// cortas para cubrir lo que trae gente de universidad o de sostenibilidad —
// sin irse al extremo contrario de una lista tan larga que deja de ayudar
// a agrupar.
export const AREAS = {
  ia_datos: 'IA y datos',
  atencion_ciudadana: 'Atención ciudadana',
  movilidad: 'Movilidad',
  ciberseguridad: 'Ciberseguridad',
  tramites_administrativos: 'Trámites administrativos',
  sostenibilidad: 'Sostenibilidad y medio ambiente',
  educacion: 'Educación y formación',
  transparencia: 'Transparencia y participación',
  otros: 'Otros',
}

export const ORDEN_AREAS = Object.keys(AREAS)

export function preguntaReto(perfil) {
  return perfil === 'administracion'
    ? '¿Cuál es tu reto principal ahora mismo?'
    : '¿En qué puedes ayudar a la Administración?'
}

/** Para quien se queda en blanco delante del textarea — un empujón
 *  concreto, no un ejemplo de relleno que la gente acabe copiando tal
 *  cual. */
export function ayudaReto(perfil) {
  return perfil === 'administracion'
    ? 'Puede ser algo muy concreto (un trámite que se atasca, un dato que no tenéis) o algo más amplio — lo que os quite el sueño ahora mismo.'
    : 'Cuéntanos a qué os dedicáis o cuál es vuestro punto fuerte — no hace falta que sea muy técnico, con que se entienda vale.'
}

/** Nombre a mostrar en un nodo del grafo, respetando la visibilidad elegida. */
export function etiquetaNodo(fila) {
  if (fila.visible && fila.organizacion?.trim()) return fila.organizacion.trim()
  return PERFILES[fila.perfil]?.corto ?? fila.perfil
}

/** Áreas de una fila ya normalizadas a array — por si queda alguna fila
 *  antigua con la columna `area` (texto suelto) en vez de `areas`. */
export function areasDeFila(fila) {
  if (Array.isArray(fila.areas) && fila.areas.length) return fila.areas
  if (fila.area) return [fila.area]
  return []
}

/** En el Radar solo hay dos lados: la Administración trae el reto, todo lo
 *  demás (empresa, startup, universidad) trae una solución. Una sola
 *  función para decidirlo, así el badge de la tarjeta y cualquier otro
 *  sitio que necesite distinguirlos leen siempre el mismo criterio. */
export function esReto(fila) {
  return fila.perfil === 'administracion'
}
