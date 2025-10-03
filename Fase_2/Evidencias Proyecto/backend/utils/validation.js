/**
 * Utilidades de validación para la Plataforma de Gestión de Viviendas TECHO
 * 
 * Este módulo contiene las funciones de validación reutilizables en toda la aplicación
 */

/**
 * Valida si una contraseña cumple con los requisitos de seguridad
 * Requisitos: mínimo 8 caracteres, al menos una letra y un número
 * @param {string} pwd - Contraseña a validar
 * @returns {boolean} True si la contraseña es válida
 */
export function isStrongPassword(pwd) {
  if (typeof pwd !== 'string') return false
  if (pwd.length < 8) return false
  
  const hasLetter = /[A-Za-z]/.test(pwd)
  const hasNumber = /[0-9]/.test(pwd)
  
  return hasLetter && hasNumber
}

/**
 * Valida el formato de un RUT chileno
 * @param {string} rut - RUT a validar (con o sin puntos y guión)
 * @returns {boolean} True si el RUT tiene formato válido
 */
export function isValidRutFormat(rut) {
  if (!rut || typeof rut !== 'string') return false
  
  // Limpiar puntos y guiones
  const cleanRut = rut.replace(/[.-]/g, '')
  
  // Debe tener entre 8 y 9 caracteres (7-8 números + dígito verificador)
  if (cleanRut.length < 8 || cleanRut.length > 9) return false
  
  // Los primeros caracteres deben ser números y el último puede ser número o K
  const rutBody = cleanRut.slice(0, -1)
  const verifier = cleanRut.slice(-1).toUpperCase()
  
  if (!/^\d+$/.test(rutBody)) return false
  if (!/^[0-9K]$/.test(verifier)) return false
  
  return true
}

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} True si el email tiene formato válido
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Normaliza un RUT removiendo puntos y guiones
 * @param {string} rut - RUT a normalizar
 * @returns {string} RUT normalizado
 */
export function normalizeRut(rut) {
  if (!rut) return ''
  return rut.replace(/[.-]/g, '').toUpperCase()
}