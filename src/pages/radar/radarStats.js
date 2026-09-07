/** Total de respuestas y de organizaciones distintas (nombre no vacío, sin
 *  distinguir mayúsculas/espacios de más). */
export function calcularStats(filas) {
  const nombres = new Set(
    filas
      .map((f) => f.organizacion?.trim().toLowerCase())
      .filter(Boolean),
  )
  return { total: filas.length, entidades: nombres.size }
}
