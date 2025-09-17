// Mapeo y utilidades de roles
export const NORMALIZED_ROLES = {
  administrador: 'administrador',
  admin: 'administrador',
  técnico: 'tecnico',
  tecnico: 'tecnico',
  beneficiario: 'beneficiario'
}

export function normalizeRole(raw) {
  if (!raw) return null
  const key = raw.toString().toLowerCase()
  return NORMALIZED_ROLES[key] || null
}

export function dashboardPathFor(role) {
  const r = normalizeRole(role)
  switch (r) {
    case 'administrador':
      return '/admin'
    case 'tecnico':
      return '/tecnico'
    case 'beneficiario':
      return '/beneficiario'
    default:
      return '/home'
  }
}

export function roleAllowed(role, allowed) {
  const r = normalizeRole(role)
  return !!allowed.map(a => normalizeRole(a)).find(a => a === r)
}
