import React, { useContext } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { normalizeRole } from '../utils/roles'

export function ProtectedRoute({ redirectTo = '/' }) {
  const { isAuthenticated, user, isLoading } = useContext(AuthContext)
  console.log('🔒 ProtectedRoute - isLoading:', isLoading)
  console.log('🔒 ProtectedRoute - isAuthenticated:', isAuthenticated)
  console.log('🔒 ProtectedRoute - user:', user)
  console.log('🔒 ProtectedRoute - redirectTo:', redirectTo)
  
  if (isLoading) {
    console.log('⏳ ProtectedRoute - Cargando autenticación, mostrando spinner...')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    console.log('❌ ProtectedRoute - No autenticado, redirigiendo a:', redirectTo)
    return <Navigate to={redirectTo} replace />
  }
  console.log('✅ ProtectedRoute - Autenticado, permitiendo acceso')
  return <Outlet />
}

export function RoleRoute({ allowed = [], fallback = '/unauthorized' }) {
  const { role, user, isLoading, isAuthenticated } = useContext(AuthContext)
  console.log('🛡️ RoleRoute - isLoading:', isLoading)
  console.log('🛡️ RoleRoute - role:', role)
  console.log('🛡️ RoleRoute - user:', user)
  console.log('🛡️ RoleRoute - allowed:', allowed)
  console.log('🛡️ RoleRoute - fallback:', fallback)
  
  if (isLoading) {
    console.log('⏳ RoleRoute - Cargando autenticación...')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    )
  }
  
  if (!role) {
    // Si ya está autenticado pero todavía no tenemos role (puede estar cargando), mostramos spinner
    if (isAuthenticated) {
      console.log('⏳ RoleRoute - Usuario autenticado pero role todavía no disponible. Esperando...')
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Preparando permisos...</p>
          </div>
        </div>
      )
    }
    console.log('❌ RoleRoute - Sin role y no autenticado, redirigiendo al login')
    return <Navigate to='/' replace />
  }
  const normalized = normalizeRole(role)
  const allowedNormalized = allowed.map(r => normalizeRole(r)).filter(Boolean)
  console.log('🛡️ RoleRoute - normalized role:', normalized)
  console.log('🛡️ RoleRoute - allowedNormalized:', allowedNormalized)
  
  if (!allowedNormalized.includes(normalized)) {
    console.log('❌ RoleRoute - Role no permitido, redirigiendo a:', fallback)
    return <Navigate to={fallback} replace />
  }
  console.log('✅ RoleRoute - Role permitido, permitiendo acceso')
  return <Outlet />
}
