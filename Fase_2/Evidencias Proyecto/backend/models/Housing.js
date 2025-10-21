/**
 * Modelo de Vivienda para interacción con la base de datos
 * Plataforma de Gestión de Viviendas TECHO
 */

import { supabase } from '../supabaseClient.js'

/**
 * Obtiene todas las viviendas con información del proyecto
 * @returns {Array} Lista de viviendas
 */
export async function getAllHousings() {
  const { data, error } = await supabase
    .from('viviendas')
    .select(`
      id_vivienda,
      estado,
      id_proyecto,
      beneficiario_uid,
      tipo_vivienda,
      metros_cuadrados,
      numero_habitaciones,
      numero_banos,
      observaciones,
      fecha_entrega,
      latitud,
      longitud,
      direccion,
      direccion_normalizada,
      proyecto!inner(nombre, ubicacion),
      beneficiario:usuarios!viviendas_beneficiario_fk(nombre, email)
    `)
    .order('id_vivienda', { ascending: true })
    
  if (error) throw error
  // Normalizamos la forma esperada por el frontend (alias planos)
  const normalized = (data || []).map((r) => ({
    ...r,
    proyecto_id: r.id_proyecto ?? r.proyecto_id ?? null,
    proyecto_nombre: r.proyecto?.nombre ?? null,
    proyecto_ubicacion: r.proyecto?.ubicacion ?? null,
    beneficiario_nombre: r.beneficiario?.nombre ?? null,
    beneficiario_email: r.beneficiario?.email ?? null,
  }))
  return normalized
}

/**
 * Obtiene una vivienda por ID
 * @param {number} id - ID de la vivienda
 * @returns {Object} Datos de la vivienda
 */
export async function getHousingById(id) {
  const { data, error } = await supabase
    .from('viviendas')
    .select(`
      *,
      proyecto(nombre, ubicacion),
      beneficiario:usuarios!viviendas_beneficiario_fk(nombre, email, rut)
    `)
    .eq('id_vivienda', id)
    .single()
    
  if (error) throw error
  return {
    ...data,
    proyecto_id: data?.id_proyecto ?? data?.proyecto_id ?? null,
    proyecto_nombre: data?.proyecto?.nombre ?? null,
    proyecto_ubicacion: data?.proyecto?.ubicacion ?? null,
    beneficiario_nombre: data?.beneficiario?.nombre ?? null,
    beneficiario_email: data?.beneficiario?.email ?? null,
  }
}

/**
 * Crea una nueva vivienda
 * @param {Object} housingData - Datos de la vivienda
 * @returns {Object} Vivienda creada
 */
export async function createHousing(housingData) {
  // Generamos un id_vivienda incremental manualmente porque la columna no es identity en la BD
  const { data: last, error: errLast } = await supabase
    .from('viviendas')
    .select('id_vivienda')
    .order('id_vivienda', { ascending: false })
    .limit(1)
  if (errLast) throw errLast
  const nextId = Array.isArray(last) && last.length ? Number(last[0].id_vivienda) + 1 : 1

  const payload = { id_vivienda: nextId, ...housingData }

  const { data, error } = await supabase
    .from('viviendas')
    .insert([payload])
    .select('*')
    .single()
    
  if (error) throw error
  return data
}

/**
 * Actualiza una vivienda
 * @param {number} id - ID de la vivienda
 * @param {Object} updates - Datos a actualizar
 * @returns {Object} Vivienda actualizada
 */
export async function updateHousing(id, updates) {
  // Aceptar alias proyecto_id desde el frontend
  const finalUpdates = { ...updates }
  if (Object.prototype.hasOwnProperty.call(finalUpdates, 'proyecto_id') && !finalUpdates.id_proyecto) {
    finalUpdates.id_proyecto = finalUpdates.proyecto_id
  }
  delete finalUpdates.proyecto_id

  // Whitelist de columnas válidas en 'viviendas' para evitar errores PGRST204
  const allowedKeys = new Set([
    'id_proyecto', 'direccion', 'estado', 'fecha_entrega', 'beneficiario_uid', 'tipo_vivienda',
    'latitud', 'longitud', 'direccion_normalizada', 'geocode_provider', 'geocode_score', 'geocode_at',
    'metros_cuadrados', 'numero_habitaciones', 'numero_banos', 'observaciones',
    'recepcion_conforme', 'fecha_recepcion_conforme'
  ])
  for (const key of Object.keys(finalUpdates)) {
    if (!allowedKeys.has(key)) {
      delete finalUpdates[key]
    }
  }

  // Evitar enviar campos opcionales nulos cuando la columna pudiera no existir aún
  const optionalKeys = ['metros_cuadrados','numero_habitaciones','numero_banos','observaciones']
  for (const key of optionalKeys) {
    if (Object.prototype.hasOwnProperty.call(finalUpdates, key)) {
      const v = finalUpdates[key]
      if (v === null || typeof v === 'undefined') delete finalUpdates[key]
    }
  }

  const { data, error } = await supabase
    .from('viviendas')
    .update(finalUpdates)
    .eq('id_vivienda', id)
    .select('*')
    .single()
    
  if (error) throw error
  return data
}

/**
 * Elimina una vivienda
 * @param {number} id - ID de la vivienda
 */
export async function deleteHousing(id) {
  const { error } = await supabase
    .from('viviendas')
    .delete()
    .eq('id_vivienda', id)
    
  if (error) throw error
}

/**
 * Asigna un beneficiario a una vivienda
 * @param {number} housingId - ID de la vivienda
 * @param {number} beneficiaryId - ID del beneficiario
 */
export async function assignBeneficiaryToHousing(housingId, beneficiaryId) {
  const { data, error } = await supabase
    .from('viviendas')
    .update({ 
      beneficiario_uid: beneficiaryId,
      estado: 'asignada'
    })
    .eq('id_vivienda', housingId)
    .select('*')
    .single()
    
  if (error) throw error
  return data
}

/**
 * Desasigna un beneficiario de una vivienda
 * @param {number} housingId - ID de la vivienda
 */
export async function unassignBeneficiaryFromHousing(housingId) {
  const { data, error } = await supabase
    .from('viviendas')
    .update({ 
      beneficiario_uid: null,
      // Si estaba asignada, regresamos a 'en_construccion' por defecto
      estado: 'en_construccion'
    })
    .eq('id_vivienda', housingId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

/**
 * Obtiene viviendas de un beneficiario específico
 * @param {number} beneficiaryId - ID del beneficiario
 * @returns {Array} Lista de viviendas del beneficiario
 */
export async function getHousingsByBeneficiary(beneficiaryId) {
  const { data, error } = await supabase
    .from('viviendas')
    .select(`
      *,
      proyecto(nombre, ubicacion)
    `)
    .eq('beneficiario_uid', beneficiaryId)
    
  if (error) throw error
  return (data || []).map(d => ({
    ...d,
    proyecto_id: d?.id_proyecto ?? d?.proyecto_id ?? null,
    proyecto_nombre: d?.proyecto?.nombre ?? null,
    proyecto_ubicacion: d?.proyecto?.ubicacion ?? null,
  }))
}

/**
 * Obtiene estadísticas de viviendas
 * @returns {Object} Estadísticas de viviendas por estado
 */
export async function getHousingStats() {
  const { data, error } = await supabase
    .from('viviendas')
    .select('estado')
    
  if (error) throw error
  
  const stats = (data || []).reduce((acc, vivienda) => {
    const estado = vivienda.estado || 'sin_estado'
    acc[estado] = (acc[estado] || 0) + 1
    return acc
  }, {})
  
  return {
    total: data?.length || 0,
    por_estado: stats
  }
}
