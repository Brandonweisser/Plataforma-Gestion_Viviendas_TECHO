import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '../../components/ui/DashboardLayout'
import { SectionPanel } from '../../components/ui/SectionPanel'
import CardIncidencia from '../../components/CardIncidencia'
import { tecnicoApi } from '../../services/api'
import { 
  ClipboardDocumentListIcon, 
  CameraIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

/**
 * Dashboard simplificado para Técnico de Campo
 * Solo muestra sus incidencias asignadas y accesos rápidos
 */
export default function HomeTecnicoCampo() {
  const [incidencias, setIncidencias] = useState([])
  const [stats, setStats] = useState({ total: 0, nuevo: 0, en_proceso: 0, resuelto: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

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
        
        // Calcular estadísticas
        const stats = {
          total: data.length,
          nuevo: data.filter(i => i.estado === 'abierta').length,
          en_proceso: data.filter(i => i.estado === 'en_proceso').length,
          resuelto: data.filter(i => i.estado === 'resuelta').length
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

  // Filtrar incidencias urgentes (alta prioridad o próximo a vencer)
  const incidenciasUrgentes = incidencias.filter(i => 
    i.prioridad === 'alta' || 
    i.plazos_legales?.estado_plazo === 'vencido' ||
    i.plazos_legales?.estado_plazo === 'proximo_vencer'
  )

  // Incidencias en proceso
  const incidenciasEnProceso = incidencias.filter(i => i.estado === 'en_proceso')

  // Incidencias nuevas
  const incidenciasNuevas = incidencias.filter(i => i.estado === 'nuevo')

  return (
    <DashboardLayout title='Dashboard Técnico' subtitle='Mis incidencias asignadas' accent='orange'>
      <div className='space-y-6'>
        
        {/* Estadísticas Rápidas */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
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
                <p className='text-sm text-gray-600 dark:text-gray-400'>Nuevas</p>
                <p className='text-3xl font-bold text-orange-600 dark:text-orange-400'>{stats.nuevo}</p>
              </div>
              <ClockIcon className='w-12 h-12 text-orange-500' />
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
                <p className='text-3xl font-bold text-green-600 dark:text-green-400'>{stats.resuelto}</p>
              </div>
              <CheckCircleIcon className='w-12 h-12 text-green-500' />
            </div>
          </div>
        </div>

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
                <p className='text-sm text-red-700 dark:text-red-300'>
                  ⚠️ Tienes <strong>{incidenciasUrgentes.length}</strong> incidencia(s) urgente(s) que requieren atención inmediata
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
            title='🚨 Incidencias Urgentes' 
            description={`${incidenciasUrgentes.length} requieren atención inmediata`}
          >
            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
              {incidenciasUrgentes.slice(0, 6).map(i => (
                <CardIncidencia 
                  key={i.id_incidencia} 
                  incidencia={i} 
                  onOpen={() => window.location.href = `/tecnico/incidencias/${i.id_incidencia}`} 
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
            title='⚙️ En Proceso' 
            description={`${incidenciasEnProceso.length} trabajos en curso`}
          >
            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
              {incidenciasEnProceso.slice(0, 6).map(i => (
                <CardIncidencia 
                  key={i.id_incidencia} 
                  incidencia={i} 
                  onOpen={() => window.location.href = `/tecnico/incidencias/${i.id_incidencia}`} 
                />
              ))}
            </div>
          </SectionPanel>
        )}

        {/* Incidencias Nuevas */}
        {incidenciasNuevas.length > 0 && (
          <SectionPanel 
            title='🆕 Nuevas Asignaciones' 
            description={`${incidenciasNuevas.length} recién asignadas`}
          >
            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
              {incidenciasNuevas.slice(0, 6).map(i => (
                <CardIncidencia 
                  key={i.id_incidencia} 
                  incidencia={i} 
                  onOpen={() => window.location.href = `/tecnico/incidencias/${i.id_incidencia}`} 
                />
              ))}
            </div>
          </SectionPanel>
        )}

        {/* Estado vacío */}
        {!loading && incidencias.length === 0 && (
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
