/**
 * Mapeo de nombres de roles para mostrar en UI
 * En backend: 'tecnico' (legacy)
 * En frontend: 'Técnico Supervisor' (amigable)
 */

export const ROLE_NAMES = {
  administrador: 'Administrador',
  tecnico: 'Técnico Supervisor',        // 👈 Nombre amigable para 'tecnico'
  tecnico_campo: 'Técnico de Campo',
  beneficiario: 'Beneficiario'
}

/**
 * Obtiene el nombre amigable de un rol
 * @param {string} role - Rol del sistema
 * @returns {string} Nombre amigable
 */
export function getRoleName(role) {
  return ROLE_NAMES[role] || role
}

/**
 * Obtiene el código del rol desde el nombre amigable
 * @param {string} friendlyName - Nombre amigable
 * @returns {string} Código del rol
 */
export function getRoleCode(friendlyName) {
  const entry = Object.entries(ROLE_NAMES).find(([_, name]) => name === friendlyName)
  return entry ? entry[0] : friendlyName
}

/**
 * Verifica si un rol es supervisor (puede asignar incidencias)
 * @param {string} role - Rol del usuario
 * @returns {boolean}
 */
export function isSupervisor(role) {
  return role === 'administrador' || role === 'tecnico'
}

/**
 * Verifica si un rol es técnico de campo
 * @param {string} role - Rol del usuario
 * @returns {boolean}
 */
export function isTecnicoCampo(role) {
  return role === 'tecnico_campo'
}

/**
 * Obtiene el color del badge según el rol
 * @param {string} role - Rol del usuario
 * @returns {string} Clases CSS para el badge
 */
export function getRoleBadgeClass(role) {
  const classes = {
    administrador: 'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300',
    tecnico: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300',
    tecnico_campo: 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
    beneficiario: 'bg-teal-100 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300'
  }
  
  return classes[role] || 'bg-gray-100 dark:bg-gray-500/15 text-gray-700 dark:text-gray-300'
}

/**
 * Obtiene todos los roles disponibles para selección
 * @returns {Array} Lista de roles con código y nombre
 */
export function getAllRoles() {
  return Object.entries(ROLE_NAMES).map(([code, name]) => ({
    code,
    name
  }))
}
