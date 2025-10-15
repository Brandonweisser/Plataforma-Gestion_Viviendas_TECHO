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

// Mapeo de prioridad por categoría (normalizada) y por grupo
// Nota: se usa para asignar prioridad automáticamente SIN depender del texto de descripción.
// Criterio general:
//  - Estructura: alta
//  - Instalaciones: alta para gas y electricidad; media para agua/sanitarios/alcantarillado/lluvias; baja para ventilación; media para calefón/termo
//  - Terminaciones: baja
export const PRIORIDAD_CATEGORIA = {
  // ===== ESTRUCTURA (ALTA) =====
  'estructura': 'alta',
  'fundaciones': 'alta',
  'cimientos': 'alta',
  'asentamientos': 'alta',
  'estructura muros': 'alta',
  'muros de carga': 'alta',
  'albanileria estructural': 'alta',
  'estructura techumbre': 'alta',
  'cerchas': 'alta',
  'anclajes': 'alta',
  'losa': 'alta',
  'losas': 'alta',
  'vigas': 'alta',
  'columnas': 'alta',
  'grietas estructurales': 'alta',
  'desplomes': 'alta',
  'estructura escalas': 'alta',

  // ===== INSTALACIONES =====
  'instalaciones': 'media',
  // Electricidad (ALTA por riesgo)
  'electricidad': 'alta',
  'electrico': 'alta',
  'instalacion electrica': 'alta',
  'tablero electrico': 'alta',
  'tomas': 'alta',
  'tomas e interruptores': 'alta',
  'interruptores': 'alta',
  'cableado': 'alta',
  'iluminacion': 'alta',
  // Gas (ALTA por seguridad)
  'gas': 'alta',
  'red gas': 'alta',
  'artefactos gas': 'alta',
  // Agua y sanitaria (MEDIA por impacto, salvo emergencias no detectables sin descripción)
  'agua': 'media',
  'agua potable': 'media',
  'plomeria': 'media',
  'gasfiteria': 'media',
  'gafiteria': 'media',
  'artefactos sanitarios': 'media',
  'desagues': 'media',
  'alcantarillado': 'media',
  // Aguas lluvias (MEDIA)
  'aguas lluvias': 'media',
  'canaletas y bajadas': 'media',
  // Ventilaciones (BAJA)
  'ventilacion': 'baja',
  'extraccion': 'baja',
  // Calefón/termo/calefacción (MEDIA por confort; considerar alta si hay gas, pero ya mapeamos gas explícito)
  'calefon': 'media',
  'termo': 'media',
  'calefaccion': 'media',
  // Telecomunicaciones (BAJA)
  'telecomunicaciones': 'baja',
  'telefonia': 'baja',
  'datos': 'baja',
  // Otros
  'otro_instalaciones': 'media',

  // ===== TERMINACIONES (BAJA) =====
  'terminaciones': 'baja',
  'acabados': 'baja',
  'pintura': 'baja',
  'revestimientos muro': 'baja',
  'estuco': 'baja',
  'yeso carton': 'baja',
  'tabiques': 'baja',
  'cielos': 'baja',
  'pisos ceramica': 'baja',
  'pisos porcelanato': 'baja',
  'pisos vinilico': 'baja',
  'pisos flotante': 'baja',
  'pisos madera': 'baja',
  'zocalos': 'baja',
  'puertas': 'baja',
  'cerraduras': 'baja',
  'herrajes': 'baja',
  'ventanas': 'baja',
  'vidrios': 'baja',
  'sellos silicona': 'baja',
  'tapajuntas': 'baja',
  'molduras': 'baja',
  'muebles cocina': 'baja',
  'muebles bano': 'baja',
  'cubierta cocina': 'baja',
  'otro_terminaciones': 'baja',

  // ===== POSVENTA GENÉRICO =====
  'posventa': 'media',
  'otro_estructura': 'alta',
}

// Mapeo de categoría/área a tipo de garantía referencial
export const GARANTIA_MAP = {
  // ===== ESTRUCTURA (10 años) =====
  estructura: 'estructura',
  'fundaciones': 'estructura',
  'cimientos': 'estructura',
  'asentamientos': 'estructura',
  'estructura muros': 'estructura',
  'muros de carga': 'estructura',
  'albanileria estructural': 'estructura',
  'estructura techumbre': 'estructura',
  'cerchas': 'estructura',
  'anclajes': 'estructura',
  'losa': 'estructura',
  'losas': 'estructura',
  'vigas': 'estructura',
  'columnas': 'estructura',
  'grietas estructurales': 'estructura',
  'desplomes': 'estructura',
  'estructura escalas': 'estructura',

  // ===== INSTALACIONES (5 años) =====
  instalaciones: 'instalaciones',
  // Electricidad
  'electricidad': 'instalaciones',
  'electrico': 'instalaciones',
  'instalacion electrica': 'instalaciones',
  'tablero electrico': 'instalaciones',
  'tomas': 'instalaciones',
  'tomas e interruptores': 'instalaciones',
  'interruptores': 'instalaciones',
  'cableado': 'instalaciones',
  'iluminacion': 'instalaciones',
  // Gas
  'gas': 'instalaciones',
  'red gas': 'instalaciones',
  'artefactos gas': 'instalaciones',
  // Agua y sanitaria
  'agua': 'instalaciones',
  'agua potable': 'instalaciones',
  'plomeria': 'instalaciones',
  'gasfiteria': 'instalaciones',
  'gafiteria': 'instalaciones',
  'artefactos sanitarios': 'instalaciones',
  'desagues': 'instalaciones',
  'alcantarillado': 'instalaciones',
  // Aguas lluvias y ventilaciones
  'aguas lluvias': 'instalaciones',
  'canaletas y bajadas': 'instalaciones',
  'ventilacion': 'instalaciones',
  'extraccion': 'instalaciones',
  // Calefon/termo/calefaccion
  'calefon': 'instalaciones',
  'termo': 'instalaciones',
  'calefaccion': 'instalaciones',
  // Telecomunicaciones (si aplica)
  'telecomunicaciones': 'instalaciones',
  'telefonia': 'instalaciones',
  'datos': 'instalaciones',

  // ===== TERMINACIONES (3 años) =====
  terminaciones: 'terminaciones',
  acabados: 'terminaciones',
  // Pinturas y recubrimientos
  pintura: 'terminaciones',
  'revestimientos muro': 'terminaciones',
  estuco: 'terminaciones',
  // Yeso-carton / tabiques / cielos
  'yeso carton': 'terminaciones',
  tabiques: 'terminaciones',
  cielos: 'terminaciones',
  // Pisos y zocalos
  'pisos ceramica': 'terminaciones',
  'pisos porcelanato': 'terminaciones',
  'pisos vinilico': 'terminaciones',
  'pisos flotante': 'terminaciones',
  'pisos madera': 'terminaciones',
  zocalos: 'terminaciones',
  // Carpinterias y vidrios
  puertas: 'terminaciones',
  cerraduras: 'terminaciones',
  herrajes: 'terminaciones',
  ventanas: 'terminaciones',
  vidrios: 'terminaciones',
  // Sellos y terminaciones finas
  'sellos silicona': 'terminaciones',
  tapajuntas: 'terminaciones',
  molduras: 'terminaciones',
  // Muebles fijos y cubiertas
  'muebles cocina': 'terminaciones',
  'muebles bano': 'terminaciones',
  'cubierta cocina': 'terminaciones',
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
  const normalize = (str) => str
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .trim()
  const key = normalize(categoria)
  return GARANTIA_MAP[key] || null
}

/**
 * Calcula prioridad sólo desde la categoría (sin usar descripción)
 * @param {string} categoria
 * @returns {'alta'|'media'|'baja'}
 */
export function computePriorityFromCategory(categoria = '') {
  const normalize = (str) => str
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .trim()
  const key = normalize(categoria)
  // Si no hay match exacto, usar grupo de garantía como fallback
  const direct = PRIORIDAD_CATEGORIA[key]
  if (direct) return direct
  const garantia = GARANTIA_MAP[key]
  if (garantia === 'estructura') return 'alta'
  if (garantia === 'instalaciones') return 'media'
  if (garantia === 'terminaciones') return 'baja'
  // Default conservador
  return 'media'
}

/**
 * Calcula fecha de vencimiento de garantía según tipo y fecha de entrega
 * @param {Date|string|null} fechaEntrega - Fecha de entrega de la vivienda
 * @param {'terminaciones'|'instalaciones'|'estructura'|null} garantiaTipo
 * @returns {string|null} Fecha ISO (YYYY-MM-DD) del vencimiento o null si no aplica
 */
export function calcularVencimientoGarantia(fechaEntrega, garantiaTipo) {
  if (!fechaEntrega || !garantiaTipo) return null
  const base = new Date(fechaEntrega)
  if (isNaN(base)) return null
  const years = garantiaTipo === 'estructura' ? 10 : garantiaTipo === 'instalaciones' ? 5 : garantiaTipo === 'terminaciones' ? 3 : 0
  if (!years) return null
  const d = new Date(Date.UTC(base.getUTCFullYear() + years, base.getUTCMonth(), base.getUTCDate()))
  // Devolver como fecha (sin hora) en ISO
  return d.toISOString().split('T')[0]
}

/**
 * Evalúa si la garantía está vigente al día de hoy según la fecha de entrega y tipo
 * @param {Date|string|null} fechaEntrega
 * @param {'terminaciones'|'instalaciones'|'estructura'|null} garantiaTipo
 * @param {Date} [hoy]
 * @returns {boolean|null} true/false si puede evaluarse, null si no aplica
 */
export function estaGarantiaVigente(fechaEntrega, garantiaTipo, hoy = new Date()) {
  const vence = calcularVencimientoGarantia(fechaEntrega, garantiaTipo)
  if (!vence) return null
  const end = new Date(vence + 'T23:59:59Z')
  return end.getTime() >= hoy.getTime()
}
