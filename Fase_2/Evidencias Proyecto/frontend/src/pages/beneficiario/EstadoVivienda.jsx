import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { DashboardLayout } from '../../components/ui/DashboardLayout'
import { SectionPanel } from '../../components/ui/SectionPanel'
import { Toast } from '../../components/ui/Toast'
import { StatusPill } from '../../components/ui/StatusPill'
import { beneficiarioApi } from '../../services/api'

export default function EstadoVivienda() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [vivienda, setVivienda] = useState(null)
  const [recepcion, setRecepcion] = useState(null)
  const [incidencias, setIncidencias] = useState([])
  const [posventaForm, setPosventaForm] = useState(null)
  const [stats, setStats] = useState({
    incidenciasAbiertas: 0,
    incidenciasResueltas: 0,
    incidenciasTotal: 0
  })

  useEffect(() => {
    loadAllData()
    
    // Manejar mensajes de éxito desde navegación
    if (location.state?.success) {
      setSuccess(location.state.success)
      // Limpiar el estado para evitar que se muestre en refresh
      window.history.replaceState({}, document.title)
    }
  }, [])

  async function loadAllData() {
    setLoading(true)
    setError('')
    
    try {
      console.log('📊 Cargando datos del estado de vivienda...')
      
      // Cargar datos en paralelo
      const [viviendaRes, recepcionRes, incidenciasRes] = await Promise.allSettled([
        beneficiarioApi.vivienda(),
        beneficiarioApi.recepcionResumen(),
        beneficiarioApi.listarIncidencias(50)
      ])

      // Procesar resultados
      if (viviendaRes.status === 'fulfilled') {
        setVivienda(viviendaRes.value.data)
        console.log('✅ Vivienda cargada:', viviendaRes.value.data)
      } else {
        console.error('❌ Error cargando vivienda:', viviendaRes.reason)
      }

      if (recepcionRes.status === 'fulfilled') {
        setRecepcion(recepcionRes.value.data)
        console.log('✅ Recepción cargada:', recepcionRes.value.data)
      } else {
        console.error('❌ Error cargando recepción:', recepcionRes.reason)
      }

      if (incidenciasRes.status === 'fulfilled') {
        const incidenciasData = incidenciasRes.value.data || []
        setIncidencias(incidenciasData)
        
        // Calcular estadísticas
        const abiertas = incidenciasData.filter(inc => ['abierta', 'asignada', 'en_progreso'].includes(inc.estado)).length
        const resueltas = incidenciasData.filter(inc => ['resuelta', 'cerrada'].includes(inc.estado)).length
        
        setStats({
          incidenciasAbiertas: abiertas,
          incidenciasResueltas: resueltas,
          incidenciasTotal: incidenciasData.length
        })
        
        console.log('✅ Incidencias cargadas:', incidenciasData.length)
      } else {
        console.error('❌ Error cargando incidencias:', incidenciasRes.reason)
      }

      // Intentar cargar formulario de posventa
      try {
        const posventaRes = await beneficiarioApi.posventaGetForm()
        setPosventaForm(posventaRes.data)
        console.log('✅ Formulario posventa cargado:', posventaRes.data)
      } catch (posventaError) {
        console.log('ℹ️ No hay formulario de posventa disponible')
        setPosventaForm(null)
      }

    } catch (generalError) {
      console.error('❌ Error general:', generalError)
      setError('Error cargando los datos de la vivienda')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoColor = (estado) => {
    const colors = {
      'borrador': 'bg-gray-100 text-gray-800',
      'enviada': 'bg-blue-100 text-blue-800',
      'revisada': 'bg-green-100 text-green-800',
      'abierta': 'bg-red-100 text-red-800',
      'asignada': 'bg-yellow-100 text-yellow-800',
      'en_progreso': 'bg-blue-100 text-blue-800',
      'resuelta': 'bg-green-100 text-green-800',
      'cerrada': 'bg-gray-100 text-gray-800'
    }
    return colors[estado] || 'bg-gray-100 text-gray-800'
  }

  const getPrioridadColor = (prioridad) => {
    const colors = {
      'alta': 'bg-red-100 text-red-800',
      'media': 'bg-yellow-100 text-yellow-800',
      'baja': 'bg-green-100 text-green-800'
    }
    return colors[prioridad] || 'bg-gray-100 text-gray-800'
  }

  const formatFecha = (fecha) => {
    if (!fecha) return 'No definida'
    return new Date(fecha).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando estado de tu vivienda...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {error && (
          <Toast
            type="error"
            message={
              <span>
                {error} <button onClick={loadAllData} className="underline">Reintentar</button>
              </span>
            }
            onClose={() => setError('')}
          />
        )}
        {success && (
          <Toast type="success" message={success} onClose={() => setSuccess('')} />
        )}

        {/* Información de la Vivienda */}
        <SectionPanel title="📍 Mi Vivienda" className="bg-blue-50">
          {vivienda ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Dirección</label>
                  <p className="text-lg font-semibold text-gray-900">{vivienda.direccion}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Proyecto</label>
                  <p className="text-gray-900">{vivienda.proyecto_nombre || 'No especificado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Fecha de Entrega</label>
                  <p className="text-gray-900">{formatFecha(vivienda.fecha_entrega)}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Tipo de Vivienda</label>
                  <p className="text-gray-900">{vivienda.tipo_vivienda || 'Estándar'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Metros Cuadrados</label>
                  <p className="text-gray-900">{vivienda.metros_cuadrados || 'No especificado'} m²</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Estado</label>
                  <StatusPill value={vivienda.estado || 'entregada'} />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">🏠</div>
              <p className="text-gray-600">No tienes una vivienda asignada</p>
              <p className="text-sm text-gray-500 mt-1">Contacta a tu coordinador para más información</p>
            </div>
          )}
        </SectionPanel>

        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{stats.incidenciasTotal}</div>
            <div className="text-sm text-gray-600">Total Incidencias</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-red-600">{stats.incidenciasAbiertas}</div>
            <div className="text-sm text-gray-600">Abiertas/En Proceso</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600">{stats.incidenciasResueltas}</div>
            <div className="text-sm text-gray-600">Resueltas</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-purple-600">
              {recepcion?.estado === 'revisada' ? '✓' : recepcion?.estado === 'enviada' ? '📋' : '⏳'}
            </div>
            <div className="text-sm text-gray-600">Estado Recepción</div>
          </div>
        </div>

        {/* Recepción de Vivienda */}
        <SectionPanel title="📋 Recepción de Vivienda" className="bg-green-50">
          {recepcion ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <StatusPill value={recepcion.estado} className="text-sm" />
                  <span className="text-sm text-gray-600">
                    Creada el {formatFecha(recepcion.fecha_creada)}
                  </span>
                </div>
                {recepcion.estado === 'borrador' && (
                  <button 
                    onClick={() => navigate('/beneficiario/recepcion')}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Completar Recepción
                  </button>
                )}
              </div>
              
              {recepcion.fecha_enviada && (
                <div className="text-sm text-gray-600">
                  <strong>Enviada:</strong> {formatFecha(recepcion.fecha_enviada)}
                </div>
              )}
              
              {recepcion.fecha_revisada && (
                <div className="text-sm text-gray-600">
                  <strong>Revisada:</strong> {formatFecha(recepcion.fecha_revisada)}
                </div>
              )}

              {recepcion.estado === 'revisada' && (
                <div className="bg-green-100 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">✓</span>
                    <span className="font-medium text-green-800">Recepción Completada</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Tu recepción ha sido revisada y aprobada. Ya puedes reportar incidencias si es necesario.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-gray-400 text-3xl mb-3">📋</div>
              <p className="text-gray-600 mb-3">No has iniciado tu recepción de vivienda</p>
              <button 
                onClick={() => navigate('/beneficiario/recepcion')}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Iniciar Recepción
              </button>
            </div>
          )}
        </SectionPanel>

        {/* Incidencias Recientes */}
        <SectionPanel title="🔧 Incidencias" className="bg-orange-50">
          <div className="space-y-4">
            {incidencias.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Incidencias Recientes</h3>
                  <div className="flex space-x-2">
                    {recepcion?.estado === 'enviada' || recepcion?.estado === 'revisada' ? (
                      <button 
                        onClick={() => navigate('/beneficiario/nueva-incidencia')}
                        className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Reportar Problema
                      </button>
                    ) : (
                      <div className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                        Completa tu recepción para reportar problemas
                      </div>
                    )}
                    {incidencias.length > 5 && (
                      <button 
                        onClick={() => navigate('/beneficiario/incidencias')}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Ver Todas
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid gap-3">
                  {incidencias.slice(0, 5).map((incidencia) => (
                    <div key={incidencia.id_incidencia} className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(incidencia.estado)}`}>
                            {incidencia.estado.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPrioridadColor(incidencia.prioridad)}`}>
                            {incidencia.prioridad}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatFecha(incidencia.fecha_reporte)}
                        </span>
                      </div>
                      <p className="text-gray-900 mb-1 line-clamp-2">{incidencia.descripcion}</p>
                      {incidencia.categoria && (
                        <p className="text-sm text-gray-600">Categoría: {incidencia.categoria}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">🔧</div>
                <p className="text-gray-600 mb-4">No tienes incidencias reportadas</p>
                {recepcion?.estado === 'enviada' || recepcion?.estado === 'revisada' ? (
                  <button 
                    onClick={() => navigate('/beneficiario/nueva-incidencia')}
                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Reportar Primera Incidencia
                  </button>
                ) : (
                  <p className="text-sm text-gray-500">Completa tu recepción para poder reportar problemas</p>
                )}
              </div>
            )}
          </div>
        </SectionPanel>

        {/* Formulario de Posventa */}
        <SectionPanel title="📊 Evaluación de Posventa" className="bg-purple-50">
          {posventaForm ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <StatusPill value={posventaForm.estado} className="text-sm" />
                  <span className="text-sm text-gray-600">
                    Creado el {formatFecha(posventaForm.fecha_creada)}
                  </span>
                </div>
                {posventaForm.estado === 'borrador' && (
                  <button 
                    onClick={() => navigate('/beneficiario/posventa')}
                    className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Completar Evaluación
                  </button>
                )}
              </div>

              {posventaForm.fecha_enviada && (
                <div className="text-sm text-gray-600">
                  <strong>Enviado:</strong> {formatFecha(posventaForm.fecha_enviada)}
                </div>
              )}

              {posventaForm.estado === 'enviada' && (
                <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-600">📊</span>
                    <span className="font-medium text-blue-800">Evaluación Enviada</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Tu evaluación de posventa ha sido enviada y está siendo procesada por nuestro equipo.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-gray-400 text-3xl mb-3">📊</div>
              <p className="text-gray-600 mb-3">No has completado tu evaluación de posventa</p>
              <p className="text-sm text-gray-500 mb-4">
                La evaluación de posventa nos ayuda a mejorar nuestros servicios
              </p>
              <button 
                onClick={() => navigate('/beneficiario/posventa')}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Iniciar Evaluación
              </button>
            </div>
          )}
        </SectionPanel>

        {/* Botón de Actualizar */}
        <div className="flex justify-center pt-4">
          <button 
            onClick={loadAllData}
            disabled={loading}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>{loading ? 'Actualizando...' : 'Actualizar Información'}</span>
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}