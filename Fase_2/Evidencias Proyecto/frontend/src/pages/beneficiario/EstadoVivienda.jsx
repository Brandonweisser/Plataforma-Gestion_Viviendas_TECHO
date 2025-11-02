import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { DashboardLayout } from '../../components/ui/DashboardLayout'
import { SectionPanel } from '../../components/ui/SectionPanel'
import { Toast } from '../../components/ui/Toast'
import { StatusPill } from '../../components/ui/StatusPill'
import { beneficiarioApi } from '../../services/api'
import { 
  DocumentTextIcon, 
  HomeIcon, 
  FolderIcon, 
  BuildingOfficeIcon,
  Square3Stack3DIcon,
  CalendarIcon,
  MapPinIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline'
import { Modal } from '../../components/ui/Modal'

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
  const [showPlanoModal, setShowPlanoModal] = useState(false)
  const [planos, setPlanos] = useState([])
  const [loadingPlanos, setLoadingPlanos] = useState(false)
  const [projectCoords, setProjectCoords] = useState(null) // Coordenadas del proyecto (geocodificadas o directas)

  // Valor de éxito proveniente de la navegación (estable y seguro para dependencias)
  const navSuccess = Boolean(location.state?.success)
  const navSuccessMsg = typeof location.state?.success === 'string' ? location.state.success : ''

  useEffect(() => {
    loadAllData()
    
    // Manejar mensajes de éxito desde navegación
    if (navSuccess) {
      setSuccess(navSuccessMsg)
      // Limpiar el estado para evitar que se muestre en refresh
      window.history.replaceState({}, document.title)
    }
  }, [navSuccess, navSuccessMsg])

  async function loadAllData() {
    setLoading(true)
    setError('')
    
    try {
      console.log('Cargando datos del estado de vivienda...')
      
      // Cargar datos en paralelo
      const [viviendaRes, recepcionRes, incidenciasRes] = await Promise.allSettled([
        beneficiarioApi.vivienda(),
        beneficiarioApi.recepcionResumen(),
        beneficiarioApi.listarIncidencias(50)
      ])

      // Procesar resultados
      if (viviendaRes.status === 'fulfilled') {
        const viviendaData = viviendaRes.value.data.vivienda
        setVivienda(viviendaData)
        console.log('✅ Vivienda cargada:', viviendaData)
        
        // Obtener coordenadas del proyecto (ya geocodificadas por el backend)
        if (viviendaData?.proyecto?.latitud && viviendaData?.proyecto?.longitud) {
          const lat = Number(viviendaData.proyecto.latitud)
          const lng = Number(viviendaData.proyecto.longitud)
          
          if (isFinite(lat) && isFinite(lng)) {
            setProjectCoords({
              lat,
              lng,
              source: 'database'
            })
            console.log('Coordenadas del proyecto:', lat, lng)
          } else {
            console.warn('Coordenadas del proyecto inválidas:', viviendaData.proyecto.latitud, viviendaData.proyecto.longitud)
          }
        } else {
          console.log('El proyecto no tiene coordenadas guardadas')
        }
      } else {
        console.error('Error cargando vivienda:', viviendaRes.reason)
      }

      if (recepcionRes.status === 'fulfilled') {
        setRecepcion(recepcionRes.value.data)
        console.log('Recepción cargada:', recepcionRes.value.data)
      } else {
        console.error('Error cargando recepción:', recepcionRes.reason)
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
        
        console.log('Incidencias cargadas:', incidenciasData.length)
      } else {
        console.error('Error cargando incidencias:', incidenciasRes.reason)
      }

      // Intentar cargar formulario de posventa
      try {
        const posventaRes = await beneficiarioApi.posventaGetForm()
        setPosventaForm(posventaRes.data)
        console.log('Formulario posventa cargado:', posventaRes.data)
      } catch (posventaError) {
        console.log('No hay formulario de posventa disponible')
        setPosventaForm(null)
      }

    } catch (generalError) {
      console.error('Error general:', generalError)
      setError('Error cargando los datos de la vivienda')
    } finally {
      setLoading(false)
    }
  }

  async function loadPlanos() {
    setLoadingPlanos(true)
    try {
      const response = await beneficiarioApi.posventaListarPlanos()
      setPlanos(response.data || [])
      setShowPlanoModal(true)
    } catch (err) {
      console.error('Error cargando planos:', err)
      setError('No se pudo cargar el plano de tu vivienda')
    } finally {
      setLoadingPlanos(false)
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
        <button 
          onClick={() => navigate('/beneficiario')} 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium transition-colors shadow-sm"
        >
          <span>←</span>
          <span>Volver al inicio</span>
        </button>

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
        <SectionPanel title={
          <div className="flex items-center gap-2">
            <HomeIcon className="w-5 h-5" />
            <span>Información y Estado de Mi Vivienda</span>
          </div>
        } className="bg-blue-50">
          {vivienda ? (
            <div className="space-y-4">
              {/* Dirección destacada */}
              <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 rounded-2xl p-4 border-2 border-sky-200 dark:border-sky-700 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center shadow-md">
                    <HomeIcon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-sky-700 dark:text-sky-300 uppercase tracking-wide mb-1">Dirección</p>
                    <p className="text-xl sm:text-2xl font-bold text-sky-900 dark:text-sky-100">{vivienda.direccion || 'No especificado'}</p>
                  </div>
                </div>
              </div>

              {/* Grid de información en cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Proyecto */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border-2 border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-600 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <FolderIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Proyecto</p>
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">{vivienda.proyecto?.nombre || 'No especificado'}</p>
                </div>

                {/* Tipo de Vivienda */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border-2 border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-600 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <BuildingOfficeIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Tipo</p>
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">{vivienda.tipo_vivienda || 'Estándar'}</p>
                </div>

                {/* Metros Cuadrados */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border-2 border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-600 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Square3Stack3DIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Metros Cuadrados</p>
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">{vivienda.metros_cuadrados ? `${vivienda.metros_cuadrados} m²` : 'No especificado'}</p>
                </div>

                {/* Fecha de Entrega */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border-2 border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-600 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Fecha de Entrega</p>
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">{vivienda.fecha_entrega ? formatFecha(vivienda.fecha_entrega) : 'No definida'}</p>
                </div>
              </div>

              {/* Ubicación y Estado */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border-2 border-slate-200 dark:border-slate-700 space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPinIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Ubicación del Proyecto</p>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{vivienda.proyecto?.ubicacion || 'No especificado'}</p>
                </div>
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <SparklesIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Estado</p>
                  </div>
                  <StatusPill value={vivienda.estado || 'entregada'} />
                </div>
              </div>

              {/* Mapa de Ubicación del Proyecto */}
              {projectCoords ? (
                <div className="pt-2">
                  <h3 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-3 text-lg">
                    <MapPinIcon className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                    <span>Ubicación del Proyecto</span>
                  </h3>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
                    <iframe
                      title="Ubicación del proyecto"
                      width="100%"
                      height="300"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${projectCoords.lat},${projectCoords.lng}&zoom=16`}
                    />
                    <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mb-2">
                        <span className="font-semibold flex items-center gap-1">
                          <MapPinIcon className="w-4 h-4" />
                          {vivienda.proyecto.nombre}
                        </span>
                        <span className="text-slate-500 dark:text-slate-500">
                          ({projectCoords.lat.toFixed(6)}, {projectCoords.lng.toFixed(6)})
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <a
                          href={`https://www.google.com/maps?q=${projectCoords.lat},${projectCoords.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Abrir en Google Maps
                        </a>
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${projectCoords.lat}&mlon=${projectCoords.lng}#map=17/${projectCoords.lat}/${projectCoords.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Ver en OpenStreetMap
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Plano de Vivienda */}
              <div className="pt-4 border-t">
                <div className="bg-white rounded-lg p-6 border shadow-sm text-center">
                  <div className="flex items-center justify-center mb-4">
                    <DocumentTextIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Plano de Vivienda</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Consulta el plano técnico de tu vivienda tipo <strong>{vivienda.tipo_vivienda}</strong>
                  </p>
                  <button
                    onClick={loadPlanos}
                    disabled={loadingPlanos}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 text-sm font-medium inline-flex items-center gap-2"
                  >
                    {loadingPlanos ? 'Cargando...' : (
                      <>
                        <DocumentTextIcon className="h-5 w-5" />
                        Ver Plano 📐
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <HomeIcon className="w-16 h-16 mx-auto" />
              </div>
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
      
        </div>


        {/* Incidencias Recientes */}
        <SectionPanel title={
          <div className="flex items-center gap-2">
            <WrenchScrewdriverIcon className="w-5 h-5" />
            <span>Incidencias</span>
          </div>
        } className="bg-orange-50">
          <div className="space-y-4">
            {incidencias.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Incidencias Recientes</h3>
                  <div className="flex flex-wrap gap-2">
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
                    <button 
                      onClick={() => navigate('/beneficiario/incidencias')}
                      className="px-4 py-2 border-2 border-orange-500 text-orange-600 text-sm rounded-lg hover:bg-orange-50 transition-colors font-medium"
                    >
                      Ver Historial Completo
                    </button>
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
                <div className="text-gray-400 mb-4">
                  <WrenchScrewdriverIcon className="w-16 h-16 mx-auto" />
                </div>
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

        
        {/* Botón de Actualizar */}
        <div className="flex justify-center pt-4">
          <button 
            onClick={loadAllData}
            disabled={loading}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <span>{loading ? 'Actualizando...' : 'Actualizar Información'}</span>
          </button>
        </div>

        {/* Modal de Planos */}
        <PlanPreviewModal 
          open={showPlanoModal} 
          onClose={() => setShowPlanoModal(false)} 
          plan={planos[0]} 
        />
      </div>
    </DashboardLayout>
  )
}

// Componente reutilizado del formulario de posventa
function PlanPreviewModal({ open, onClose, plan }) {
  if (!open) return null
  const url = plan?.url || ''
  const mime = (plan?.mime_type || plan?.mime || '').toLowerCase()
  const isPdf = mime.includes('pdf') || url.toLowerCase().endsWith('.pdf')
  const isImage = mime.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(url)
  const cadViewerUrl = url ? `https://sharecad.org/cadframe/load?url=${encodeURIComponent(url)}` : ''

  return (
    <Modal isOpen={open} onClose={onClose} maxWidth="max-w-5xl">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Plano de tu Vivienda</h3>
        <div className="flex items-center gap-2">
          {url ? (
            <a href={url} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-100 text-sm hover:bg-slate-200 dark:hover:bg-slate-600">Abrir en pestaña</a>
          ) : null}
          <button onClick={onClose} className="px-3 py-1.5 rounded bg-slate-800 text-white text-sm hover:bg-slate-700">Cerrar</button>
        </div>
      </div>
      <div className="p-4">
        {!plan ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No hay planos disponibles para tu vivienda</p>
            <p className="text-sm text-gray-500 mt-2">Contacta al equipo técnico si necesitas consultar los planos</p>
          </div>
        ) : isPdf ? (
          <iframe title="Plano PDF" src={url} className="w-full h-[80vh] border rounded" />
        ) : isImage ? (
          <div className="w-full flex items-center justify-center">
            <img src={url} alt="Plano" className="max-h-[80vh] w-auto object-contain" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-6 text-sm text-gray-700 dark:text-gray-300">
              No se puede previsualizar este tipo de archivo de forma nativa. Intentaremos usar un visor CAD online.
            </div>
            {cadViewerUrl ? (
              <iframe title="Plano CAD" src={cadViewerUrl} className="w-full h-[80vh] border rounded" />
            ) : null}
          </div>
        )}
      </div>
    </Modal>
  )
}