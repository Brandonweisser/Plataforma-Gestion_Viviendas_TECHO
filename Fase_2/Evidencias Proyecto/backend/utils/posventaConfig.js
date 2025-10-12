/**
 * Configuración de SLA y reglas de posventa (parametrizable)
 * Estos valores deben ajustarse según Bases/Contrato del proyecto con SERVIU/TECHO.
 */

export const POSVENTA_SLA = {
  // Días para atención inicial según prioridad (sugerencia)
  atencion: {
    alta: 7,
    media: 15,
    baja: 30,
  },
  // Plazo máximo global para cierre desde la creación (sugerencia; confirmar con el contrato del proyecto)
  cierreMaxDias: 120,
}

// Mapeo de categoría/área a tipo de garantía referencial
export const GARANTIA_MAP = {
  // Estructura: 10 años
  estructura: 'estructura',
  // Instalaciones: 5 años
  instalaciones: 'instalaciones',
  electrico: 'instalaciones',
  agua: 'instalaciones',
  plomeria: 'instalaciones',
  // Terminaciones: 3 años
  acabados: 'terminaciones',
  pintura: 'terminaciones',
  puertas: 'terminaciones',
  ventanas: 'terminaciones',
}

/**
 * Calcula fechas límite de atención y cierre según prioridad y configuración
 * @param {'alta'|'media'|'baja'} prioridad
 * @param {Date} fechaBase
 * @returns {{ fecha_limite_atencion: string, fecha_limite_cierre: string }}
 */
export function calcularFechasLimite(prioridad, fechaBase = new Date()) {
  const d = new Date(fechaBase)
  const addDays = (date, days) => {
    const nd = new Date(date)
    nd.setDate(nd.getDate() + days)
    return nd
  }
  const atencionDias = POSVENTA_SLA.atencion[prioridad] ?? 15
  const fechaAtencion = addDays(d, atencionDias)
  const fechaCierre = addDays(d, POSVENTA_SLA.cierreMaxDias)
  return {
    fecha_limite_atencion: fechaAtencion.toISOString(),
    fecha_limite_cierre: fechaCierre.toISOString(),
  }
}

/**
 * Determina tipo de garantía a partir de la categoría declarada
 * @param {string} categoria
 * @returns {'terminaciones'|'instalaciones'|'estructura'|null}
 */
export function obtenerGarantiaPorCategoria(categoria = '') {
  const key = categoria.toString().toLowerCase()
  return GARANTIA_MAP[key] || null
}
