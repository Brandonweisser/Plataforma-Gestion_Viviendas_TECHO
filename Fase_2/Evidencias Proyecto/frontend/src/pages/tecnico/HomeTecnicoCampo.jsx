import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../../components/ui/DashboardLayout'
import { SectionPanel } from '../../components/ui/SectionPanel'
import CardIncidencia from '../../components/CardIncidencia'
import { tecnicoApi } from '../../services/api'
import { 
  ClipboardDocumentListIcon, 
  CameraIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  BellAlertIcon,
  MapPinIcon,
  FolderIcon,
  HomeModernIcon,
  FireIcon,
  UserIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'

/**
 * Dashboard simplificado para Técnico de Campo
 * Solo muestra sus incidencias asignadas y accesos rápidos
 */
export default function HomeTecnicoCampo() {
  const navigate = useNavigate()
  const [incidencias, setIncidencias] = useState([])
  const [visitasSugeridas, setVisitasSugeridas] = useState([])
  const [stats, setStats] = useState({ total: 0, en_proceso: 0, cerradas: 0 })
  const [loading, setLoading] = useState(true)
  const [loadingVisitas, setLoadingVisitas] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
    loadVisitasSugeridas()
  }, [])

  async function loadVisitasSugeridas() {
    try {
      setLoadingVisitas(true)
      const response = await tecnicoApi.obtenerVisitasSugeridas()
      
      if (response.success) {
        // Tomar solo las primeras 5 visitas sugeridas
        setVisitasSugeridas((response.data || []).slice(0, 5))
      }
    } catch (err) {
      console.error('Error cargando visitas sugeridas:', err)
      // No mostramos error aquí porque no es crítico
    } finally {
      setLoadingVisitas(false)
    }
  }

  async function loadData() {
    try {
      setLoading(true)
      
      // Cargar incidencias (backend filtra automáticamente para tecnico_campo - solo ve sus asignadas)
      const response = await tecnicoApi.listarIncidencias({ 
        limit: 100,
        includeMedia: true
      })

      if (response.success) {
        const data = response.data || []
        setIncidencias(data)
        
        // Calcular estadísticas (solo incidencias activas para el total)
        const incidenciasActivas = data.filter(i => !['cerrada', 'descartada'].includes(i.estado))
        const incidenciasCerradas = data.filter(i => ['cerrada', 'resuelta'].includes(i.estado))
        
        const stats = {
          total: incidenciasActivas.length,
          en_proceso: data.filter(i => i.estado === 'en_proceso').length,
          cerradas: incidenciasCerradas.length
        }
        setStats(stats)
      } else {
        setError(response.message || 'Error al cargar incidencias')
      }
    } catch (err) {
      console.error('Error cargando dashboard:', err)
      setError('No se pudieron cargar tus incidencias asignadas')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar incidencias por estado (excluir cerradas y descartadas de las activas)
  const incidenciasActivas = incidencias.filter(i => !['cerrada', 'descartada', 'resuelta'].includes(i.estado))
  const incidenciasCerradas = incidencias.filter(i => ['cerrada', 'resuelta'].includes(i.estado))
  
  // Filtrar incidencias urgentes (solo de las activas)
  const incidenciasUrgentes = incidenciasActivas.filter(i => 
    i.prioridad === 'alta' || 
    i.plazos_legales?.estado_plazo === 'vencido' ||
    i.plazos_legales?.estado_plazo === 'proximo_vencer'
  )

  // Incidencias en proceso
  const incidenciasEnProceso = incidenciasActivas.filter(i => i.estado === 'en_proceso')

  return (
    <DashboardLayout title='Dashboard Técnico' subtitle='Mis incidencias asignadas' accent='orange'>
      <div className='space-y-6'>
        
        {/* Estadísticas Rápidas */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600 dark:text-gray-400'>Total Asignadas</p>
                <p className='text-3xl font-bold text-gray-900 dark:text-gray-100'>{stats.total}</p>
              </div>
              <ClipboardDocumentListIcon className='w-12 h-12 text-blue-500' />
            </div>
          </div>

          <div className='bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600 dark:text-gray-400'>En Proceso</p>
                <p className='text-3xl font-bold text-yellow-600 dark:text-yellow-400'>{stats.en_proceso}</p>
              </div>
              <CameraIcon className='w-12 h-12 text-yellow-500' />
            </div>
          </div>

          <div className='bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600 dark:text-gray-400'>Resueltas</p>
                <p className='text-3xl font-bold text-green-600 dark:text-green-400'>{stats.cerradas}</p>
              </div>
              <CheckCircleIcon className='w-12 h-12 text-green-500' />
            </div>
          </div>
        </div>

        {/* Visitas Sugeridas para Hoy */}
        {!loadingVisitas && visitasSugeridas.length > 0 && (
          <SectionPanel 
            title='Mis Visitas Sugeridas para Hoy' 
            description='Ordenadas por urgencia y plazos legales'
            icon={CalendarDaysIcon}
          >
            <div className='space-y-3'>
              {visitasSugeridas.map((visita, idx) => {
                // Determinar color e icono según urgencia
                const urgenciaConfig = {
                  'critica': { 
                    bg: 'bg-red-50 dark:bg-red-900/20', 
                    border: 'border-red-300 dark:border-red-700',
                    text: 'text-red-700 dark:text-red-400',
                    icon: FireIcon,
                    label: 'URGENTE - Plazo vencido'
                  },
                  'alta': { 
                    bg: 'bg-orange-50 dark:bg-orange-900/20', 
                    border: 'border-orange-300 dark:border-orange-700',
                    text: 'text-orange-700 dark:text-orange-400',
                    icon: ExclamationTriangleIcon,
                    label: 'Alta prioridad'
                  },
                  'media': { 
                    bg: 'bg-yellow-50 dark:bg-yellow-900/20', 
                    border: 'border-yellow-300 dark:border-yellow-700',
                    text: 'text-yellow-700 dark:text-yellow-400',
                    icon: BellAlertIcon,
                    label: 'Prioridad media'
                  },
                  'normal': { 
                    bg: 'bg-blue-50 dark:bg-blue-900/20', 
                    border: 'border-blue-300 dark:border-blue-700',
                    text: 'text-blue-700 dark:text-blue-400',
                    icon: MapPinIcon,
                    label: 'Normal'
                  }
                }

                const config = urgenciaConfig[visita.urgencia_nivel] || urgenciaConfig.normal
                const esProgramada = visita.es_visita_programada
                const IconComponent = config.icon

                return (
                  <div 
                    key={visita.id_incidencia}
                    className={`${config.bg} border-2 ${config.border} rounded-xl p-4 
                               hover:shadow-md transition-all cursor-pointer 
                               ${esProgramada ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => navigate(`/tecnico/incidencias/${visita.id_incidencia}`)}
                  >
                    <div className='flex items-start justify-between gap-4'>
                      {/* Número de visita */}
                      <div className='flex-shrink-0 w-8 h-8 bg-white dark:bg-gray-800 rounded-full 
                                    flex items-center justify-center font-bold text-gray-700 dark:text-gray-300 
                                    border-2 border-gray-300 dark:border-gray-600'>
                        {idx + 1}
                      </div>

                      {/* Contenido principal */}
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-2 flex-wrap'>
                          <IconComponent className={`w-5 h-5 ${config.text}`} />
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${config.text} bg-white/50`}>
                            {config.label}
                          </span>
                          {esProgramada && (
                            <span className='text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300 flex items-center gap-1'>
                              <CalendarDaysIcon className='w-4 h-4' />
                              Programada por supervisor
                            </span>
                          )}
                          {visita.plazos_legales?.dias_restantes !== undefined && (
                            <span className='text-xs font-medium px-2 py-1 rounded-full bg-white/70 text-gray-700 flex items-center gap-1'>
                              <ClockIcon className='w-4 h-4' />
                              {visita.plazos_legales.dias_restantes} día(s) restante(s)
                            </span>
                          )}
                        </div>

                        <h4 className='font-bold text-base text-gray-900 dark:text-gray-100 mb-1 line-clamp-1'>
                          {visita.descripcion}
                        </h4>

                        <div className='flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-2'>
                          <FolderIcon className='w-4 h-4' />
                          {visita.categoria || 'General'}
                        </div>

                        <div className='flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                          <MapPinIcon className='w-4 h-4' />
                          {visita.vivienda?.direccion}
                        </div>

                        {/* Información del beneficiario */}
                        {visita.reporta && (
                          <div className='bg-white/50 dark:bg-gray-800/50 rounded-lg p-2 space-y-1 mb-2'>
                            {visita.reporta.nombre && (
                              <div className='flex items-center gap-1.5 text-xs'>
                                <UserIcon className='w-3.5 h-3.5 text-gray-600 dark:text-gray-400' />
                                <span className='font-semibold text-gray-700 dark:text-gray-300'>{visita.reporta.nombre}</span>
                              </div>
                            )}
                            {visita.reporta.telefono && (
                              <div className='flex items-center gap-1.5'>
                                <PhoneIcon className='w-3.5 h-3.5 text-gray-600 dark:text-gray-400' />
                                <a 
                                  href={`tel:${visita.reporta.telefono}`}
                                  className='text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline'
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {visita.reporta.telefono}
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        {visita.vivienda?.proyecto?.nombre && (
                          <div className='flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1'>
                            <HomeModernIcon className='w-4 h-4' />
                            {visita.vivienda.proyecto.nombre}
                          </div>
                        )}
                      </div>

                      {/* Botón ver detalle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/tecnico/incidencias/${visita.id_incidencia}`)
                        }}
                        className='flex-shrink-0 px-4 py-2 bg-white dark:bg-gray-700 
                                 text-gray-700 dark:text-gray-200 rounded-lg font-medium 
                                 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 
                                 transition-colors border border-gray-300 dark:border-gray-600'
                      >
                        Ver →
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {visitasSugeridas.length >= 5 && (
              <div className='mt-4 text-center'>
                <Link 
                  to='/tecnico/incidencias?asignacion=asignadas'
                  className='text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium inline-flex items-center gap-1'
                >
                  Ver todas mis incidencias →
                </Link>
              </div>
            )}
          </SectionPanel>
        )}

        {/* Alerta si hay incidencias urgentes */}
        {incidenciasUrgentes.length > 0 && (
          <div className='bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <svg className='h-5 w-5 text-red-400' viewBox='0 0 20 20' fill='currentColor'>
                  <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' clipRule='evenodd' />
                </svg>
              </div>
              <div className='ml-3'>
                <p className='text-sm text-red-700 dark:text-red-300 font-medium flex items-center gap-1'>
                  <ExclamationTriangleIcon className='w-5 h-5' />
                  Tienes <strong>{incidenciasUrgentes.length}</strong> incidencia(s) urgente(s) que requieren atención inmediata
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Accesos Rápidos */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <Link 
            to='/tecnico/incidencias?asignacion=asignadas&estado=nuevo'
            className='bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg'
          >
            <ClockIcon className='w-8 h-8 mb-2' />
            <h3 className='text-lg font-semibold'>Ver Nuevas</h3>
            <p className='text-sm opacity-90'>Incidencias recién asignadas</p>
          </Link>

          <Link 
            to='/tecnico/incidencias?asignacion=asignadas&estado=en_proceso'
            className='bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg p-6 hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-lg'
          >
            <CameraIcon className='w-8 h-8 mb-2' />
            <h3 className='text-lg font-semibold'>En Proceso</h3>
            <p className='text-sm opacity-90'>Trabajos en curso</p>
          </Link>

          <Link 
            to='/tecnico/incidencias?asignacion=asignadas'
            className='bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg'
          >
            <ClipboardDocumentListIcon className='w-8 h-8 mb-2' />
            <h3 className='text-lg font-semibold'>Ver Todas</h3>
            <p className='text-sm opacity-90'>Mis incidencias asignadas</p>
          </Link>
        </div>

        {/* Incidencias Urgentes */}
        {incidenciasUrgentes.length > 0 && (
          <SectionPanel 
            title='Incidencias Urgentes' 
            description={`${incidenciasUrgentes.length} requieren atención inmediata`}
            icon={FireIcon}
          >
            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
              {incidenciasUrgentes.slice(0, 6).map(i => (
                <CardIncidencia 
                  key={i.id_incidencia} 
                  incidencia={i} 
                  onOpen={(inc) => {
                    console.log('🔍 Navegando a incidencia:', inc.id_incidencia)
                    navigate(`/tecnico/incidencias/${inc.id_incidencia}`)
                  }} 
                />
              ))}
            </div>
            {incidenciasUrgentes.length > 6 && (
              <div className='mt-4 text-center'>
                <Link 
                  to='/tecnico/incidencias?asignacion=asignadas&prioridad=alta'
                  className='text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium'
                >
                  Ver todas las urgentes →
                </Link>
              </div>
            )}
          </SectionPanel>
        )}

        {/* Incidencias en Proceso */}
        {incidenciasEnProceso.length > 0 && (
          <SectionPanel 
            title='En Proceso' 
            description={`${incidenciasEnProceso.length} trabajos en curso`}
            icon={CameraIcon}
          >
            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
              {incidenciasEnProceso.slice(0, 6).map(i => (
                <CardIncidencia 
                  key={i.id_incidencia} 
                  incidencia={i} 
                  onOpen={(inc) => {
                    console.log('🔍 Navegando a incidencia:', inc.id_incidencia)
                    navigate(`/tecnico/incidencias/${inc.id_incidencia}`)
                  }} 
                />
              ))}
            </div>
          </SectionPanel>
        )}

        {/* Incidencias Cerradas/Resueltas */}
        {incidenciasCerradas.length > 0 && (
          <SectionPanel 
            title='Incidencias Cerradas' 
            description={`${incidenciasCerradas.length} completadas`}
            icon={CheckCircleIcon}
          >
            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
              {incidenciasCerradas.slice(0, 6).map(i => (
                <CardIncidencia 
                  key={i.id_incidencia} 
                  incidencia={i} 
                  onOpen={(inc) => {
                    navigate(`/tecnico/incidencias/${inc.id_incidencia}`)
                  }} 
                />
              ))}
            </div>
            {incidenciasCerradas.length > 6 && (
              <div className='mt-4 text-center'>
                <Link 
                  to='/tecnico/incidencias?estado=cerrada,resuelta'
                  className='text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium inline-flex items-center gap-1'
                >
                  Ver todas las cerradas ({incidenciasCerradas.length}) →
                </Link>
              </div>
            )}
          </SectionPanel>
        )}

        {/* Estado vacío */}
        {!loading && incidenciasActivas.length === 0 && incidenciasCerradas.length === 0 && (
          <SectionPanel title='Sin incidencias asignadas'>
            <div className='text-center py-12'>
              <ClipboardDocumentListIcon className='w-16 h-16 mx-auto text-gray-400 mb-4' />
              <p className='text-lg text-gray-600 dark:text-gray-400'>
                No tienes incidencias asignadas en este momento
              </p>
              <p className='text-sm text-gray-500 dark:text-gray-500 mt-2'>
                Tu supervisor te asignará trabajos próximamente
              </p>
            </div>
          </SectionPanel>
        )}

        {/* Estado de carga */}
        {loading && (
          <div className='text-center py-12'>
            <div className='inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
            <p className='text-gray-600 dark:text-gray-400 mt-4'>Cargando tus incidencias...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'>
            <p className='text-red-600 dark:text-red-400'>{error}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
