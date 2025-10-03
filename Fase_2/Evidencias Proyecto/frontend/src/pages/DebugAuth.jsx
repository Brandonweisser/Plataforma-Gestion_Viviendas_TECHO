import React, { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export default function DebugAuth() {
  const { user, role, isAuthenticated, isLoading } = useContext(AuthContext)
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Estado de Autenticación - Debug</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <strong>Estado del Problema:</strong>
            <div className="mt-2 p-4 bg-yellow-100 rounded text-sm">
              {!user && "❌ No hay usuario logueado"}
              {user && !user.rol && !user.role && "❌ Usuario sin rol definido"}
              {user && (user.rol || user.role) && "✅ Usuario con rol válido"}
            </div>
          </div>
          
          <div>
            <strong>isLoading:</strong> {isLoading ? 'true' : 'false'}
          </div>
          
          <div>
            <strong>isAuthenticated:</strong> {isAuthenticated ? 'true' : 'false'}
          </div>
          
          <div>
            <strong>role (desde context):</strong> {role || 'null'}
          </div>
          
          <div>
            <strong>Usuario completo:</strong>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
          
          <div>
            <strong>localStorage user:</strong>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
              {localStorage.getItem('user') || 'null'}
            </pre>
          </div>
          
          <div>
            <strong>localStorage token:</strong>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
              {localStorage.getItem('token') ? 'Presente (' + localStorage.getItem('token').substring(0, 20) + '...)' : 'null'}
            </pre>
          </div>
        </div>
        
        <div className="mt-6 space-x-4">
          <button 
            onClick={() => window.location.href = '/home'}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Ir a Home
          </button>
          <button 
            onClick={() => window.location.href = '/admin/proyectos'}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Probar Admin Proyectos
          </button>
          <button 
            onClick={() => {
              // Forzar rol de administrador para testing
              const testUser = {
                uid: 'test-admin',
                email: 'admin@test.com',
                nombre: 'Admin Test',
                rol: 'administrador'
              };
              localStorage.setItem('user', JSON.stringify(testUser));
              window.location.reload();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Forzar Admin Test
          </button>
        </div>
      </div>
    </div>
  )
}