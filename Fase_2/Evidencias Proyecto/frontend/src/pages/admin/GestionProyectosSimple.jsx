import React from 'react'

export default function GestionProyectosSimple() {
  console.log('📋 GestionProyectosSimple - Componente cargado correctamente')
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ✅ Gestión de Proyectos - Funcionando
          </h1>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Si puedes ver esta página, significa que:
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>✅ La autenticación funciona</li>
              <li>✅ La validación de roles funciona</li>
              <li>✅ La navegación funciona</li>
              <li>✅ El componente se carga correctamente</li>
            </ul>
            
            <div className="mt-6 space-x-4">
              <button 
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Volver al Dashboard
              </button>
              
              <button 
                onClick={() => window.location.href = '/admin/viviendas'}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Probar Gestión de Viviendas
              </button>
              
              <button 
                onClick={() => window.location.href = '/admin/asignaciones'}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Probar Asignaciones
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}