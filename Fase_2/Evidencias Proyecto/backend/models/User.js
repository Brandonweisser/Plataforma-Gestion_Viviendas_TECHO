/**
 * Modelo de Usuario para interacción con la base de datos
 * Plataforma de Gestión de Viviendas TECHO
 * 
 * Este modelo maneja todas las operaciones CRUD relacionadas con usuarios
 */

import { supabase } from '../supabaseClient.js'

/**
 * Función auxiliar para obtener overrides de testing
 * Permite inyectar funciones mock durante las pruebas
 */
function getOverrides() {
  return global.__supabaseMock || {}
}

/**
 * Busca un usuario por su email
 * @param {string} email - Email del usuario (será normalizado a minúsculas)
 * @returns {Object|null} Datos del usuario o null si no existe
 */
export async function findUserByEmail(email) {
  const overrides = getOverrides()
  if (overrides.findUserByEmail) return overrides.findUserByEmail(email)

  const emailLower = email.toLowerCase()
  
  const { data, error } = await supabase
    .from('usuarios')
    .select('uid, nombre, email, rol, password_hash, rut')
    .eq('email', emailLower)
    .maybeSingle()
    
  if (error) throw error
  return data
}

/**
 * Busca un usuario por su RUT
 * @param {string} rut - RUT del usuario
 * @returns {Object|null} Datos del usuario o null si no existe
 */
export async function findUserByRut(rut) {
  const overrides = getOverrides()
  if (overrides.findUserByRut) return overrides.findUserByRut(rut)
  
  const { data, error } = await supabase
    .from('usuarios')
    .select('uid, nombre, email, rol, password_hash, rut')
    .eq('rut', rut)
    .maybeSingle()
    
  if (error) throw error
  return data
}

/**
 * Obtiene el último usuario registrado (para generar nuevo UID)
 * @returns {Object|null} Usuario con el UID más alto o null
 */
export async function getLastUser() {
  const overrides = getOverrides()
  if (overrides.getLastUser) return overrides.getLastUser()
  
  const { data, error } = await supabase
    .from('usuarios')
    .select('uid')
    .order('uid', { ascending: false })
    .limit(1)
    
  if (error) throw error
  return Array.isArray(data) && data.length ? data[0] : null
}

/**
 * Crea un nuevo usuario en la base de datos
 * @param {Object} userRecord - Datos del usuario a crear
 * @returns {Object} Usuario creado con sus datos
 */
export async function insertUser(userRecord) {
  const overrides = getOverrides()
  if (overrides.insertUser) return overrides.insertUser(userRecord)
  
  const { data, error } = await supabase
    .from('usuarios')
    .insert([userRecord])
    .select('uid, rol, rut, direccion')
    .single()
    
  if (error) throw error
  return data
}

/**
 * Obtiene un usuario por su UID
 * @param {number} uid - UID del usuario
 * @returns {Object} Datos del usuario
 */
export async function getUserById(uid) {
  const overrides = getOverrides()
  if (overrides.getUserById) return overrides.getUserById(uid)
  
  const { data, error } = await supabase
    .from('usuarios')
    .select('uid, nombre, email, rol, rut, direccion, telefono, constructora_id')
    .eq('uid', uid)
    .single()
    
  if (error) throw error
  return data
}

/**
 * Obtiene todos los usuarios (para panel administrativo)
 * @returns {Array} Lista de todos los usuarios
 */
export async function getAllUsers() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('uid, nombre, email, rol, rut, direccion, telefono, constructora_id, created_at')
    .order('uid', { ascending: true })
    
  if (error) throw error
  return data || []
}

/**
 * Actualiza los datos de un usuario
 * @param {number} uid - UID del usuario a actualizar
 * @param {Object} updates - Datos a actualizar
 * @returns {Object} Usuario actualizado
 */
export async function updateUser(uid, updates) {
  const { data, error } = await supabase
    .from('usuarios')
    .update(updates)
    .eq('uid', uid)
    .select('uid, nombre, email, rol, rut, direccion, telefono, constructora_id')
    .single()
    
  if (error) throw error
  return data
}

/**
 * Elimina un usuario de la base de datos
 * @param {number} uid - UID del usuario a eliminar
 */
export async function deleteUser(uid) {
  const { error } = await supabase
    .from('usuarios')
    .delete()
    .eq('uid', uid)
    
  if (error) throw error
}
