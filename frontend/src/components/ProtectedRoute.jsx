import React, { useContext } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { normalizeRole } from '../utils/roles'

export function ProtectedRoute({ redirectTo = '/login' }) {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando sesión...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to={redirectTo} replace />;

  return <Outlet />;
}

export function RoleRoute({ allowed = [], fallback = '/unauthorized' }) {
  const { role } = useContext(AuthContext)
  if (!role) return <Navigate to='/' replace />
  const normalized = normalizeRole(role)
  const allowedNormalized = allowed.map(r => normalizeRole(r)).filter(Boolean)
  if (!allowedNormalized.includes(normalized)) {
    return <Navigate to={fallback} replace />
  }
  return <Outlet />
}
