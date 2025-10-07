/**
 * Modelo de Proyecto para interacción con la base de datos
 * Plataforma de Gestión de Viviendas TECHO
 */

import { supabase } from '../supabaseClient.js'

/**
 * Obtiene todos los proyectos
 * @returns {Array} Lista de proyectos
 */
export async function getAllProjects() {
  const { data, error } = await supabase
    .from('proyecto')
    .select('id_proyecto, nombre, ubicacion, ubicacion_normalizada, ubicacion_referencia, latitud, longitud, fecha_inicio, fecha_entrega')
    .order('id_proyecto', { ascending: true })
    
  if (error) throw error
  return data || []
}

/**
 * Obtiene un proyecto por ID
 * @param {number} id - ID del proyecto
 * @returns {Object} Datos del proyecto
 */
export async function getProjectById(id) {
  const { data, error } = await supabase
    .from('proyecto')
    .select('*')
    .eq('id_proyecto', id)
    .single()
    
  if (error) throw error
  return data
}

/**
 * Crea un nuevo proyecto
 * @param {Object} projectData - Datos del proyecto
 * @returns {Object} Proyecto creado
 */
export async function createProject(projectData) {
  const { data, error } = await supabase
    .from('proyecto')
    .insert([projectData])
    .select('*')
    .single()
    
  if (error) throw error
  return data
}

/**
 * Actualiza un proyecto
 * @param {number} id - ID del proyecto
 * @param {Object} updates - Datos a actualizar
 * @returns {Object} Proyecto actualizado
 */
export async function updateProject(id, updates) {
  const { data, error } = await supabase
    .from('proyecto')
    .update(updates)
    .eq('id_proyecto', id)
    .select('*')
    .single()
    
  if (error) throw error
  return data
}

/**
 * Elimina un proyecto
 * @param {number} id - ID del proyecto
 */
export async function deleteProject(id) {
  const { error } = await supabase
    .from('proyecto')
    .delete()
    .eq('id_proyecto', id)
    
  if (error) throw error
}

/**
 * Obtiene técnicos asignados a un proyecto
 * @param {number} projectId - ID del proyecto
 * @returns {Array} Lista de técnicos asignados
 */
export async function getProjectTechnicians(projectId) {
  const { data, error } = await supabase
    .from('proyecto_tecnico')
    .select(`
      id_usuario_tecnico,
      usuarios!inner(uid, nombre, email)
    `)
    .eq('id_proyecto', projectId)
    
  if (error) throw error
  return data || []
}

/**
 * Asigna un técnico a un proyecto
 * @param {number} projectId - ID del proyecto
 * @param {number} technicianId - ID del técnico
 */
export async function assignTechnicianToProject(projectId, technicianId) {
  const { error } = await supabase
    .from('proyecto_tecnico')
    .insert([{
      id_proyecto: projectId,
      id_usuario_tecnico: technicianId
    }])
    
  if (error) throw error
}

/**
 * Remueve un técnico de un proyecto
 * @param {number} projectId - ID del proyecto
 * @param {number} technicianId - ID del técnico
 */
export async function removeTechnicianFromProject(projectId, technicianId) {
  const { error } = await supabase
    .from('proyecto_tecnico')
    .delete()
    .eq('id_proyecto', projectId)
    .eq('id_usuario_tecnico', technicianId)
    
  if (error) throw error
}
