/**
 * Módulo de Plazos Legales para Incidencias
 * Plataforma de Gestión de Viviendas TECHO
 * 
 * Calcula plazos legales según normativa chilena (LGUC, DS49, SERVIU)
 * para la resolución de incidencias en viviendas sociales.
 */

/**
 * Plazos legales por prioridad (en días hábiles)
 * Basado en:
 * - Ley General de Urbanismo y Construcciones (LGUC - DFL 458)
 * - Decreto Supremo 49 (DS49) - Vivienda Social
 * - Reglamento SERVIU
 */
export const PLAZOS_LEGALES = {
  alta: {
    dias_respuesta: 2,      // Días hábiles para respuesta inicial
    dias_resolucion: 5,     // Días hábiles para resolución completa
    descripcion: 'Problemas estructurales, sin servicios básicos, riesgo inmediato'
  },
  media: {
    dias_respuesta: 5,
    dias_resolucion: 10,
    descripcion: 'Defectos graves que afectan habitabilidad'
  },
  baja: {
    dias_respuesta: 10,
    dias_resolucion: 20,
    descripcion: 'Terminaciones, estética, problemas menores'
  }
}

/**
 * Verifica si una fecha es día hábil (lunes a viernes)
 * @param {Date} fecha - Fecha a verificar
 * @returns {boolean} - true si es día hábil
 */
export function esDiaHabil(fecha) {
  const dia = fecha.getDay()
  // 0 = Domingo, 6 = Sábado
  return dia !== 0 && dia !== 6
}

/**
 * Suma días hábiles a una fecha
 * @param {Date} fechaInicio - Fecha inicial
 * @param {number} diasHabiles - Cantidad de días hábiles a sumar
 * @returns {Date} - Nueva fecha
 */
export function sumarDiasHabiles(fechaInicio, diasHabiles) {
  const fecha = new Date(fechaInicio)
  let diasSumados = 0
  
  while (diasSumados < diasHabiles) {
    fecha.setDate(fecha.getDate() + 1)
    if (esDiaHabil(fecha)) {
      diasSumados++
    }
  }
  
  return fecha
}

/**
 * Calcula días hábiles entre dos fechas
 * @param {Date} fechaInicio - Fecha inicial
 * @param {Date} fechaFin - Fecha final
 * @returns {number} - Cantidad de días hábiles
 */
export function calcularDiasHabilesEntre(fechaInicio, fechaFin) {
  const inicio = new Date(fechaInicio)
  const fin = new Date(fechaFin)
  let diasHabiles = 0
  
  const actual = new Date(inicio)
  while (actual <= fin) {
    if (esDiaHabil(actual)) {
      diasHabiles++
    }
    actual.setDate(actual.getDate() + 1)
  }
  
  return diasHabiles
}

/**
 * Calcula las fechas límite para una incidencia
 * @param {Date|string} fechaReporte - Fecha de reporte de la incidencia
 * @param {string} prioridad - Prioridad (alta, media, baja)
 * @returns {Object} - Objeto con fechas límite
 */
export function calcularPlazosIncidencia(fechaReporte, prioridad) {
  const prioridadLower = (prioridad || 'media').toLowerCase()
  const plazos = PLAZOS_LEGALES[prioridadLower] || PLAZOS_LEGALES.media
  
  const fechaInicio = new Date(fechaReporte)
  
  return {
    fecha_limite_respuesta: sumarDiasHabiles(fechaInicio, plazos.dias_respuesta),
    fecha_limite_resolucion: sumarDiasHabiles(fechaInicio, plazos.dias_resolucion),
    dias_respuesta_establecidos: plazos.dias_respuesta,
    dias_resolucion_establecidos: plazos.dias_resolucion
  }
}

/**
 * Calcula el estado actual de los plazos para una incidencia
 * @param {Object} incidencia - Objeto de incidencia con fecha_reporte y prioridad
 * @returns {Object} - Objeto con estado de plazos y métricas
 */
export function calcularEstadoPlazos(incidencia) {
  if (!incidencia || !incidencia.fecha_reporte) {
    return null
  }
  
  const prioridad = (incidencia.prioridad || 'media').toLowerCase()
  const plazos = calcularPlazosIncidencia(incidencia.fecha_reporte, prioridad)
  
  const ahora = new Date()
  const fechaReporte = new Date(incidencia.fecha_reporte)
  
  // Calcular días hábiles transcurridos y restantes
  const diasTranscurridos = calcularDiasHabilesEntre(fechaReporte, ahora)
  const diasRestantes = Math.max(0, plazos.dias_resolucion_establecidos - diasTranscurridos)
  
  // Calcular porcentaje transcurrido
  const porcentajeTranscurrido = Math.min(100, (diasTranscurridos / plazos.dias_resolucion_establecidos) * 100)
  
  // Determinar estado del plazo
  let estadoPlazo = 'dentro_plazo'
  let estaVencido = false
  
  if (diasRestantes === 0 || ahora > plazos.fecha_limite_resolucion) {
    estadoPlazo = 'vencido'
    estaVencido = true
  } else if (diasRestantes <= 2 || porcentajeTranscurrido >= 80) {
    estadoPlazo = 'proximo_vencer'
  }
  
  return {
    fecha_limite_respuesta: plazos.fecha_limite_respuesta.toISOString(),
    fecha_limite_resolucion: plazos.fecha_limite_resolucion.toISOString(),
    dias_respuesta_establecidos: plazos.dias_respuesta_establecidos,
    dias_resolucion_establecidos: plazos.dias_resolucion_establecidos,
    dias_transcurridos: diasTranscurridos,
    dias_restantes: diasRestantes,
    porcentaje_transcurrido: Math.round(porcentajeTranscurrido),
    estado_plazo: estadoPlazo,
    esta_vencido: estaVencido
  }
}

/**
 * Determina prioridad sugerida según categoría de incidencia
 * @param {string} categoria - Categoría de la incidencia
 * @returns {string} - Prioridad sugerida (alta, media, baja)
 */
export function determinarPrioridadPorCategoria(categoria) {
  const categoriaLower = (categoria || '').toLowerCase()
  
  // Prioridad ALTA: problemas estructurales, servicios básicos, seguridad
  if (categoriaLower.includes('estructura') || 
      categoriaLower.includes('humedad') ||
      categoriaLower.includes('electr') ||
      categoriaLower.includes('agua') ||
      categoriaLower.includes('gas') ||
      categoriaLower.includes('cañería') ||
      categoriaLower.includes('filtración') ||
      categoriaLower.includes('grieta')) {
    return 'alta'
  }
  
  // Prioridad MEDIA: problemas que afectan habitabilidad pero no son urgentes
  if (categoriaLower.includes('ventana') ||
      categoriaLower.includes('puerta') ||
      categoriaLower.includes('techo') ||
      categoriaLower.includes('piso')) {
    return 'media'
  }
  
  // Prioridad BAJA: problemas estéticos o menores
  return 'baja'
}

/**
 * Genera textos explicativos sobre plazos legales
 * @param {string} prioridad - Prioridad de la incidencia
 * @returns {Object} - Textos para mostrar al usuario
 */
export function obtenerTextosPlazosLegales(prioridad) {
  const prioridadLower = (prioridad || 'media').toLowerCase()
  const plazos = PLAZOS_LEGALES[prioridadLower] || PLAZOS_LEGALES.media
  
  return {
    titulo: `Plazos Legales - Prioridad ${prioridad.toUpperCase()}`,
    descripcion: plazos.descripcion,
    plazo_respuesta: `${plazos.dias_respuesta} días hábiles`,
    plazo_resolucion: `${plazos.dias_resolucion} días hábiles`,
    texto_completo: `Según normativa vigente (LGUC/DS49), esta incidencia debe tener respuesta inicial en ${plazos.dias_respuesta} días hábiles y estar resuelta en ${plazos.dias_resolucion} días hábiles desde su reporte.`
  }
}
