/**
 * Modelo de Incidencias para interacción con la base de datos
 * Plataforma de Gestión de Viviendas TECHO
 */

import { supabase } from '../supabaseClient.js'

/**
 * Obtiene todas las incidencias (para administradores)
 * @returns {Array} Lista de incidencias
 */
export async function getAllIncidences() {
  const { data, error } = await supabase
    .from('incidencias')
    .select(`
      *,
      viviendas(id_vivienda, direccion, proyecto(nombre)),
      reporta:usuarios!incidencias_id_usuario_reporta_fkey(nombre, email),
      tecnico:usuarios!incidencias_id_usuario_tecnico_fkey(nombre, email)
    `)
    .order('fecha_reporte', { ascending: false })
    
  if (error) throw error
  return data || []
}

/**
 * Obtiene incidencias de un beneficiario específico
 * @param {number} beneficiaryId - ID del beneficiario
 * @returns {Array} Lista de incidencias del beneficiario
 */
export async function getIncidencesByBeneficiary(beneficiaryId) {
  const { data, error } = await supabase
    .from('incidencias')
    .select(`
      *,
      viviendas(id_vivienda, direccion, proyecto(nombre))
    `)
    .eq('id_usuario_reporta', beneficiaryId)
    .order('fecha_reporte', { ascending: false })
    
  if (error) throw error
  return data || []
}

/**
 * Crea una nueva incidencia
 * @param {Object} incidenceData - Datos de la incidencia
 * @returns {Object} Incidencia creada
 */
export async function createIncidence(incidenceData) {
  // Seleccionamos sólo columnas existentes explícitamente para evitar referencias fantasma a 'fecha_creacion'
  const selectCols = 'id_incidencia,id_vivienda,id_usuario_reporta,id_usuario_tecnico,descripcion,estado,fecha_reporte,categoria,prioridad,prioridad_origen,prioridad_final,version'
  const { data, error } = await supabase
    .from('incidencias')
    .insert([incidenceData])
    .select(selectCols)
    .single()

  if (error) {
    console.error('Error createIncidence (detalle raw):', error)
    throw error
  }
  return data
}

/**
 * Actualiza una incidencia
 * @param {number} id - ID de la incidencia
 * @param {Object} updates - Datos a actualizar
 * @returns {Object} Incidencia actualizada
 */
export async function updateIncidence(id, updates) {
  const { data, error } = await supabase
    .from('incidencias')
    .update(updates)
    .eq('id_incidencia', id)
    .select('*')
    .single()
    
  if (error) throw error
  return data
}

/**
 * Calcula la prioridad de una incidencia basada en categoría y descripción
 * @param {string} categoria - Categoría de la incidencia
 * @param {string} descripcion - Descripción de la incidencia
 * @returns {string} Prioridad: 'alta', 'media', 'baja'
 */
export function computePriority(categoria, descripcion) {
  const categoriaLower = (categoria || '').toString().toLowerCase()
  const desc = (descripcion || '').toString().toLowerCase()

  // Peligro inmediato para la seguridad
  const danger = ['gas', 'fuego', 'incend', 'chispa', 'humo', 'corto', 'electrocut', 'explosi']
  if (danger.some(k => desc.includes(k))) return 'alta'
  
  if (categoriaLower.includes('eléctrico') || categoriaLower.includes('electrico')) {
    if (/(corto|chispa|humo|olor|quemado)/.test(desc)) return 'alta'
    return 'media'
  }

  // Problemas de agua/plomería
  const waterHigh = ['inund', 'sin agua', 'alcantarill', 'rebalse']
  if (waterHigh.some(k => desc.includes(k))) return 'alta'
  
  if (categoriaLower.includes('plomer') || categoriaLower.includes('agua') || 
      /fuga|goteo|filtraci[óo]n|desag[üu]e/.test(desc)) {
    return /fuga|goteo|filtraci[óo]n/.test(desc) ? 'media' : 'media'
  }

  // Problemas estructurales
  if (categoriaLower.includes('estructura') || /techo|muro|pared|grieta|colaps/.test(desc)) {
    if (/grieta|colaps|agujero|ca[ií]do/.test(desc)) return 'alta'
    if (/techo|humedad|goteo|filtraci[óo]n/.test(desc)) return 'media'
  }

  // Problemas sanitarios críticos
  if (/(bañ|sanitari|letrin)/.test(desc) && /(sin|no funciona|rebalse)/.test(desc)) return 'alta'

  // Problemas cosméticos/menores
  if (/(pintura|rasgu|mueble|bisagra|cerradura|puerta|ventana)/.test(desc)) return 'baja'

  // Por defecto
  return 'media'
}

/**
 * Registra un evento en el historial de una incidencia
 * @param {Object} eventData - Datos del evento
 */
export async function logIncidenciaEvent(eventData) {
  try {
    const {
      incidenciaId,
      actorUid,
      actorRol,
      tipo,
      estadoAnterior = null,
      estadoNuevo = null,
      diff = null,
      comentario = null,
      metadata = null
    } = eventData

    const payload = {
      incidencia_id: incidenciaId,
      actor_uid: actorUid || null,
      actor_rol: actorRol || null,
      tipo_evento: tipo,
      estado_anterior: estadoAnterior,
      estado_nuevo: estadoNuevo,
      datos_diff: diff ? JSON.stringify(diff) : null,
      comentario: comentario || null,
      metadata: metadata ? JSON.stringify(metadata) : null
    }

    const { error } = await supabase
      .from('incidencia_historial')
      .insert([payload])
      
    if (error) {
      console.warn('No se pudo registrar historial incidencia:', error.message)
    }
  } catch (error) {
    console.warn('Error inesperado registrando historial:', error.message)
  }
}
