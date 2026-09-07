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

// Los seis valores exactos que acepta la columna `area`.
export const AREAS = {
  ia_datos: 'IA y datos',
  atencion_ciudadana: 'Atención ciudadana',
  movilidad: 'Movilidad',
  ciberseguridad: 'Ciberseguridad',
  tramites_administrativos: 'Trámites administrativos',
  otros: 'Otros',
}

export const ORDEN_AREAS = Object.keys(AREAS)

export function preguntaReto(perfil) {
  return perfil === 'administracion'
    ? '¿Cuál es tu reto principal ahora mismo?'
    : '¿En qué puedes ayudar a la Administración?'
}

/** Nombre a mostrar en un nodo del grafo, respetando la visibilidad elegida. */
export function etiquetaNodo(fila) {
  if (fila.visible && fila.organizacion?.trim()) return fila.organizacion.trim()
  return PERFILES[fila.perfil]?.corto ?? fila.perfil
}
