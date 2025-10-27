/**
 * Modelo Constructora
 * Operaciones básicas sobre la tabla `constructoras` en Supabase
 */
import { supabase } from '../supabaseClient.js'

export async function getAllConstructoras() {
  const { data, error } = await supabase
    .from('constructoras')
    .select('*')
    .order('id', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getConstructoraById(id) {
  const { data, error } = await supabase
    .from('constructoras')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getUsersByConstructora(id) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('uid, nombre, email, rol, rut, direccion, constructora_id')
    .eq('constructora_id', id)
    .order('uid', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createConstructora(payload) {
  const { data, error } = await supabase
    .from('constructoras')
    .insert([payload])
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateConstructora(id, updates) {
  const { data, error } = await supabase
    .from('constructoras')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deleteConstructora(id) {
  // Antes de eliminar, limpiar asignaciones de usuarios (set NULL)
  const { error: clearError } = await supabase
    .from('usuarios')
    .update({ constructora_id: null })
    .eq('constructora_id', id)

  if (clearError) throw clearError

  const { error } = await supabase
    .from('constructoras')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

/**
 * Asigna una constructora a un usuario (actualiza usuarios.constructora_id)
 */
export async function assignConstructoraToUser(uid, constructoraId) {
  const { data, error } = await supabase
    .from('usuarios')
    .update({ constructora_id: constructoraId })
    .eq('uid', uid)
    .select('uid, nombre, email, rol, constructora_id')
    .single()

  if (error) throw error
  return data
}

export async function removeConstructoraFromUser(uid) {
  const { data, error } = await supabase
    .from('usuarios')
    .update({ constructora_id: null })
    .eq('uid', uid)
    .select('uid, nombre, email, rol, constructora_id')
    .single()

  if (error) throw error
  return data
}
