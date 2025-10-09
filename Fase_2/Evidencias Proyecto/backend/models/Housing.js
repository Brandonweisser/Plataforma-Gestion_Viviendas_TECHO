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
      latitud,
      longitud,
      direccion,
      direccion_normalizada,
      proyecto!inner(nombre, ubicacion),
      beneficiario:usuarios!viviendas_beneficiario_uid_fkey(nombre, email)
    `)
    .order('id_vivienda', { ascending: true })
    
  if (error) throw error
  return data || []
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
      beneficiario:usuarios!viviendas_beneficiario_uid_fkey(nombre, email, rut)
    `)
    .eq('id_vivienda', id)
    .single()
    
  if (error) throw error
  return data
}

/**
 * Crea una nueva vivienda
 * @param {Object} housingData - Datos de la vivienda
 * @returns {Object} Vivienda creada
 */
export async function createHousing(housingData) {
  const { data, error } = await supabase
    .from('viviendas')
    .insert([housingData])
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
  const { data, error } = await supabase
    .from('viviendas')
    .update(updates)
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
  return data || []
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
