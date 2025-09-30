import React, { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export default function TestPage() {
  const { user, role, isAuthenticated } = useContext(AuthContext)
  
  console.log('🧪 TestPage - Componente cargado')
  console.log('🧪 TestPage - Usuario:', user)
  console.log('🧪 TestPage - Rol:', role)
  console.log('🧪 TestPage - Autenticado:', isAuthenticated)
  
  return (
    <div className="min-h-screen bg-green-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-green-600 mb-4">
            ✅ ¡Test Page Funcionando!
          </h1>
          
          <div className="space-y-4">
            <p className="text-lg text-gray-700">
              Si puedes ver esta página, las rutas están funcionando correctamente.
            </p>
            
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-bold mb-2">Información del Usuario:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
            
            <div className="space-x-4">
              <button 
                onClick={() => window.location.href = '/home'}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Volver a Home
              </button>
              
              <button 
                onClick={() => window.location.href = '/admin/proyectos'}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Ir a Admin Proyectos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}