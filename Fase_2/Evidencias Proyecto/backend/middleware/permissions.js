/**
 * Middleware de Permisos Granulares
 * Define permisos específicos por rol
 */

// Definición de permisos por rol
export const PERMISSIONS = {
  administrador: {
    // Admin tiene acceso total
    all: true,
    incidencias: ['ver_todas', 'crear', 'editar', 'eliminar', 'asignar', 'cerrar'],
    proyectos: ['ver', 'crear', 'editar', 'eliminar', 'asignar_tecnicos'],
    usuarios: ['ver', 'crear', 'editar', 'eliminar', 'cambiar_roles'],
    formularios: ['ver_todos', 'crear', 'editar', 'aprobar', 'generar_pdf'],
    viviendas: ['ver_todas', 'crear', 'editar', 'eliminar'],
    reportes: ['ver', 'exportar', 'estadisticas_globales']
  },
  
  tecnico: {
    // Técnico (Supervisor) - Ve todo su scope, puede asignar
    incidencias: ['ver_todas', 'crear', 'editar', 'asignar', 'resolver'],
    proyectos: ['ver_asignados'],
    usuarios: ['ver_tecnicos'], // Solo ve otros técnicos para asignar
    formularios: ['ver_todos', 'crear', 'editar', 'generar_pdf'],
    viviendas: ['ver_proyectos_asignados', 'editar_estado'],
    reportes: ['ver_propios', 'estadisticas_proyectos']
  },
  
  tecnico_campo: {
    // Técnico de Campo - Solo sus asignaciones
    incidencias: ['ver_asignadas', 'editar_asignadas', 'resolver_asignadas', 'subir_evidencia'],
    proyectos: ['ver_asignados'],
    usuarios: [], // No ve usuarios
    formularios: ['ver_asignados', 'crear', 'editar_asignados'],
    viviendas: ['ver_proyectos_asignados'],
    reportes: ['ver_propios']
  },
  
  beneficiario: {
    // Beneficiario - Solo su vivienda
    incidencias: ['ver_propias', 'crear', 'comentar'],
    proyectos: [], // No ve proyectos
    usuarios: [], // No ve usuarios
    formularios: ['ver_propios', 'completar_recepcion'],
    viviendas: ['ver_propia'],
    reportes: []
  }
}

/**
 * Verifica si un rol tiene un permiso específico
 * @param {string} role - Rol del usuario
 * @param {string} resource - Recurso (ej: 'incidencias')
 * @param {string} action - Acción (ej: 'ver_todas')
 * @returns {boolean}
 */
export function hasPermission(role, resource, action) {
  const rolePerms = PERMISSIONS[role]
  if (!rolePerms) return false
  
  // Admin tiene acceso total
  if (rolePerms.all) return true
  
  // Verificar permiso específico
  const resourcePerms = rolePerms[resource]
  if (!resourcePerms) return false
  
  return resourcePerms.includes(action)
}

/**
 * Middleware para verificar permisos en rutas
 * Uso: checkPermission('incidencias', 'ver_todas')
 */
export function checkPermission(resource, action) {
  return (req, res, next) => {
    const userRole = req.user?.rol || req.user?.role
    
    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      })
    }
    
    if (!hasPermission(userRole, resource, action)) {
      return res.status(403).json({
        success: false,
        message: `No tienes permiso para: ${action} en ${resource}`
      })
    }
    
    next()
  }
}

/**
 * Verifica si el usuario es supervisor (puede asignar incidencias)
 */
export function isSupervisor(req, res, next) {
  const userRole = req.user?.rol || req.user?.role
  
  if (userRole === 'administrador' || userRole === 'tecnico') {
    return next()
  }
  
  return res.status(403).json({
    success: false,
    message: 'Solo supervisores pueden realizar esta acción'
  })
}

/**
 * Obtiene el alcance de incidencias según el rol
 */
export function getIncidenciaScope(userRole, userId) {
  switch(userRole) {
    case 'administrador':
      return { scope: 'all' }
    
    case 'tecnico':
      return { scope: 'supervisor', userId }
    
    case 'tecnico_campo':
      return { scope: 'asignadas', userId }
    
    case 'beneficiario':
      return { scope: 'propias', userId }
    
    default:
      return { scope: 'none' }
  }
}
