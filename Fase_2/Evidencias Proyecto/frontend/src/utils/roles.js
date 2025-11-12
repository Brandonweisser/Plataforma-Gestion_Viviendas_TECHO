// Mapeo y utilidades de roles
export const NORMALIZED_ROLES = {
  administrador: 'administrador',
  admin: 'administrador',
  técnico: 'tecnico',
  tecnico: 'tecnico',
  tecnico_campo: 'tecnico_campo',
  'tecnico campo': 'tecnico_campo',
  beneficiario: 'beneficiario'
}

export function normalizeRole(raw) {
  if (!raw) return null
  const key = raw.toString().trim().toLowerCase()
  return NORMALIZED_ROLES[key] || null
}

export function dashboardPathFor(role) {
  const r = normalizeRole(role)
  switch (r) {
    case 'administrador':
      return '/home'  // Cambiado de '/admin' a '/home' donde está HomeAdministrador
    case 'tecnico':
      return '/home'  // Cambiado de '/tecnico' a '/home' donde está HomeTecnico
    case 'tecnico_campo':
      return '/home'  // Dashboard de técnico de campo
    case 'beneficiario':
      return '/home'  // Cambiado de '/beneficiario' a '/home' donde está HomeBeneficiario
    default:
      return '/home'
  }
}

export function roleAllowed(role, allowed) {
  const r = normalizeRole(role)
  return !!allowed.map(a => normalizeRole(a)).find(a => a === r)
}
