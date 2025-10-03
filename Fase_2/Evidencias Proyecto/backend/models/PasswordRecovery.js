/**
 * Modelo de Recuperación de Contraseña
 * Plataforma de Gestión de Viviendas TECHO
 * 
 * Maneja la lógica de códigos de recuperación de contraseña
 */

import { supabase } from '../supabaseClient.js'

/**
 * Genera y almacena un código de recuperación de contraseña
 * @param {string} email - Email del usuario
 * @param {string} code - Código de recuperación de 6 dígitos
 */
export async function storeRecoveryCode(email, code) {
  // El código expira en 5 minutos
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
  
  const { error } = await supabase
    .from('password_recovery_codes')
    .insert([{
      email: email.toLowerCase(),
      code,
      expires_at: expiresAt.toISOString()
    }])
    
  if (error) throw error
}

/**
 * Valida un código de recuperación
 * @param {string} email - Email del usuario
 * @param {string} code - Código a validar
 * @returns {Object|null} Datos del código si es válido, null si no
 */
export async function validateRecoveryCode(email, code) {
  const { data, error } = await supabase
    .from('password_recovery_codes')
    .select('id, expires_at, used')
    .eq('email', email.toLowerCase())
    .eq('code', code)
    .eq('used', false)
    .gte('expires_at', new Date().toISOString())
    .maybeSingle()
    
  if (error) throw error
  return data
}

/**
 * Marca un código de recuperación como usado
 * @param {string} email - Email del usuario
 * @param {string} code - Código a marcar como usado
 */
export async function markRecoveryCodeAsUsed(email, code) {
  const { error } = await supabase
    .from('password_recovery_codes')
    .update({ used: true })
    .eq('email', email.toLowerCase())
    .eq('code', code)
    
  if (error) throw error
}

/**
 * Limpia códigos de recuperación expirados o usados
 * Esta función debería ejecutarse periódicamente para mantener la tabla limpia
 */
export async function cleanupExpiredCodes() {
  const { error } = await supabase
    .from('password_recovery_codes')
    .delete()
    .or(`expires_at.lt.${new Date().toISOString()},used.eq.true`)
    
  if (error) throw error
}
