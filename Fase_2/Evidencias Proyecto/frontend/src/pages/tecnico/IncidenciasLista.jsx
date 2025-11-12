import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../../components/ui/DashboardLayout'
import { SectionPanel } from '../../components/ui/SectionPanel'
import CardIncidencia from '../../components/CardIncidencia'
import AsignarTecnicoModal from '../../components/AsignarTecnicoModal'
import { tecnicoApi } from '../../services/api'
import { isSupervisor } from '../../utils/roleNames'
import { UserPlusIcon } from '@heroicons/react/24/outline'

export default function IncidenciasListaTecnico() {
  const navigate = useNavigate()
  const [incidencias, setIncidencias] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Inicializar filtros - siempre empezar con valores por defecto
  const initialFilters = useMemo(() => {
    return {
      proyecto: '',
      prioridad: '',
      asignacion: 'all',
      plazo: ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Sin dependencias - solo se calcula una vez
  
  const [filters, setFilters] = useState(initialFilters)
  const [filtersCerradas, setFiltersCerradas] = useState({ proyecto: '', prioridad: '', asignacion: 'all' })
  const [showAsignarModal, setShowAsignarModal] = useState(false)
  const [selectedIncidencia, setSelectedIncidencia] = useState(null)

  // Obtener rol del usuario desde localStorage
  const userRole = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      return user.rol || user.role
    } catch {
      return null
    }
  }, [])

  const canAssign = isSupervisor(userRole)

  // Cargar proyectos al montar
  useEffect(() => {
    loadProyectos()
  }, [])

  async function loadProyectos() {
    try {
      const response = await fetch('/api/admin/proyectos', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setProyectos(data.data || [])
      }
    } catch (err) {
      console.error('Error cargando proyectos:', err)
    }
  }

  async function load(offset = 0) {
    setLoading(true); setError('')
    try {
      // Solo enviar filtros si no son valores por defecto
      const params = { offset }
      if (filters.prioridad) params.prioridad = filters.prioridad
      if (filters.asignacion && filters.asignacion !== 'all') params.asignacion = filters.asignacion
      
      const r = await tecnicoApi.listarIncidencias(params)
      let data = r.data || []
      
      // Filtrado client-side por proyecto
      if (filters.proyecto) {
        data = data.filter(inc => {
          const idProyecto = inc.viviendas?.proyecto?.id_proyecto || inc.viviendas?.id_proyecto
          return idProyecto === Number(filters.proyecto)
        })
      }
      
      // Filtrado client-side por estado_plazo
      if (filters.plazo) {
        data = data.filter(inc => inc.plazos_legales?.estado_plazo === filters.plazo)
      }
      
      setIncidencias(data)
    } catch (e) {
      setError(e.message || 'Error cargando incidencias')
    } finally { setLoading(false) }
  }

  function resetFilters() {
    setFilters({ proyecto: '', prioridad: '', asignacion: 'all', plazo: '' })
  }

  // Separar incidencias activas y cerradas
  const incidenciasActivas = useMemo(() => {
    return incidencias.filter(inc => !['cerrada', 'cancelada', 'descartada'].includes((inc.estado || '').toLowerCase()))
  }, [incidencias])

  const incidenciasCerradas = useMemo(() => {
    let cerradas = incidencias.filter(inc => ['cerrada', 'cancelada', 'descartada'].includes((inc.estado || '').toLowerCase()))
    
    // Aplicar filtros de cerradas
    if (filtersCerradas.proyecto) {
      cerradas = cerradas.filter(inc => {
        const idProyecto = inc.viviendas?.proyecto?.id_proyecto || inc.viviendas?.id_proyecto
        return idProyecto === Number(filtersCerradas.proyecto)
      })
    }
    if (filtersCerradas.prioridad) {
      cerradas = cerradas.filter(inc => inc.prioridad === filtersCerradas.prioridad)
    }
    if (filtersCerradas.asignacion === 'asignadas') {
      cerradas = cerradas.filter(inc => inc.id_usuario_tecnico)
    } else if (filtersCerradas.asignacion === 'unassigned') {
      cerradas = cerradas.filter(inc => !inc.id_usuario_tecnico)
    }
    
    return cerradas
  }, [incidencias, filtersCerradas])

  useEffect(() => { load(0) // eslint-disable-next-line
  }, [filters.proyecto, filters.prioridad, filters.asignacion, filters.plazo])

  return (
    <DashboardLayout title='Incidencias' subtitle='Visión global' accent='orange'>
      <div className='space-y-6'>
        {/* Filtros para Incidencias Activas */}
        <SectionPanel title='Filtros - Incidencias Activas' description='Refina la búsqueda'>
          <div className='flex flex-wrap items-end gap-4'>
            <div className='flex flex-col'>
              <label className='text-xs font-medium text-techo-gray-600'>Proyecto</label>
              <select className='input' value={filters.proyecto} onChange={e => setFilters(f => ({ ...f, proyecto: e.target.value }))}>
                <option value=''>Todos los proyectos</option>
                {proyectos.map(p => (
                  <option key={p.id_proyecto} value={p.id_proyecto}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className='flex flex-col'>
              <label className='text-xs font-medium text-techo-gray-600'>Prioridad</label>
              <select className='input' value={filters.prioridad} onChange={e => setFilters(f => ({ ...f, prioridad: e.target.value }))}>
                <option value=''>Todas</option>
                <option value='alta'>Alta</option>
                <option value='media'>Media</option>
                <option value='baja'>Baja</option>
              </select>
            </div>
            <div className='flex flex-col'>
              <label className='text-xs font-medium text-techo-gray-600'>Asignación</label>
              <select className='input' value={filters.asignacion} onChange={e => setFilters(f => ({ ...f, asignacion: e.target.value }))}>
                <option value='all'>Todas</option>
                <option value='asignadas'>Mis asignadas</option>
                <option value='unassigned'>Sin asignar</option>
                {canAssign && <option value='proyecto'>Del proyecto</option>}
              </select>
            </div>
            <div className='flex flex-col'>
              <label className='text-xs font-medium text-techo-gray-600'>Estado de Plazo</label>
              <select className='input' value={filters.plazo} onChange={e => setFilters(f => ({ ...f, plazo: e.target.value }))}>
                <option value=''>Todos</option>
                <option value='vencido'>🔴 Vencido</option>
                <option value='proximo_vencer'>🟡 Próximo a vencer</option>
                <option value='dentro_plazo'>🟢 Dentro del plazo</option>
              </select>
            </div>
            <button className='btn btn-primary' onClick={() => load(0)} disabled={loading}>
              {loading ? 'Cargando...' : 'Refrescar'}
            </button>
            <button className='btn btn-secondary' onClick={resetFilters} disabled={loading}>
              Limpiar filtros
            </button>
          </div>
        </SectionPanel>

        {/* Listado Incidencias Activas */}
        <SectionPanel title='Incidencias Activas' description={`Total activas: ${incidenciasActivas.length}`}>        
          {loading && <div className='text-sm text-techo-gray-500'>Cargando...</div>}
          {error && <div className='text-sm text-red-600'>{error}</div>}
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
            {incidenciasActivas.map(i => (
              <div key={i.id_incidencia} className='relative'>
                <CardIncidencia incidencia={i} onOpen={() => navigate(`/tecnico/incidencias/${i.id_incidencia}`)} />
                {/* 🆕 Botón Asignar (solo para supervisores) */}
                {canAssign && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedIncidencia(i)
                      setShowAsignarModal(true)
                    }}
                    className='absolute top-2 right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors'
                    title={i.id_usuario_tecnico ? 'Reasignar técnico' : 'Asignar técnico'}
                  >
                    <UserPlusIcon className='w-5 h-5' />
                  </button>
                )}
              </div>
            ))}
          </div>
          {!loading && incidenciasActivas.length === 0 && <div className='text-sm text-techo-gray-500'>Sin incidencias activas.</div>}
        </SectionPanel>

        {/* 🆕 Modal de Asignación */}
        {showAsignarModal && selectedIncidencia && (
          <AsignarTecnicoModal
            incidenciaId={selectedIncidencia.id_incidencia}
            incidencia={selectedIncidencia}
            onClose={() => {
              setShowAsignarModal(false)
              setSelectedIncidencia(null)
            }}
            onSuccess={() => {
              load(0) // Recargar lista
            }}
          />
        )}

        {/* Filtros para Incidencias Cerradas */}
        <div className='mt-12 pt-8 border-t-4 border-slate-300 dark:border-slate-600'>
          <SectionPanel title='Filtros - Incidencias Cerradas/Terminadas' description='Filtra incidencias finalizadas'>
            <div className='flex flex-wrap items-end gap-4'>
              <div className='flex flex-col'>
                <label className='text-xs font-medium text-techo-gray-600'>Proyecto</label>
                <select className='input' value={filtersCerradas.proyecto} onChange={e => setFiltersCerradas(f => ({ ...f, proyecto: e.target.value }))}>
                  <option value=''>Todos los proyectos</option>
                  {proyectos.map(p => (
                    <option key={p.id_proyecto} value={p.id_proyecto}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className='flex flex-col'>
                <label className='text-xs font-medium text-techo-gray-600'>Prioridad</label>
                <select className='input' value={filtersCerradas.prioridad} onChange={e => setFiltersCerradas(f => ({ ...f, prioridad: e.target.value }))}>
                  <option value=''>Todas</option>
                  <option value='alta'>Alta</option>
                  <option value='media'>Media</option>
                  <option value='baja'>Baja</option>
                </select>
              </div>
              <div className='flex flex-col'>
                <label className='text-xs font-medium text-techo-gray-600'>Asignación</label>
                <select className='input' value={filtersCerradas.asignacion} onChange={e => setFiltersCerradas(f => ({ ...f, asignacion: e.target.value }))}>
                  <option value='all'>Todas</option>
                  <option value='asignadas'>Mis asignadas</option>
                  <option value='unassigned'>Sin asignar</option>
                </select>
              </div>
            </div>
          </SectionPanel>

          {/* Listado Incidencias Cerradas */}
          <div className='bg-slate-100 dark:bg-slate-800/50 rounded-xl p-6 border-2 border-slate-300 dark:border-slate-600'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h3 className='text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2'>
                  <span className='text-2xl'>📦</span>
                  Incidencias Cerradas/Terminadas
                </h3>
                <p className='text-xs text-slate-500 dark:text-slate-400 mt-1'>Historial de incidencias finalizadas - Total: {incidenciasCerradas.length}</p>
              </div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-75'>
              {incidenciasCerradas.map(i => (
                <CardIncidencia key={i.id_incidencia} incidencia={i} onOpen={() => navigate(`/tecnico/incidencias/${i.id_incidencia}`)} />
              ))}
            </div>
            {incidenciasCerradas.length === 0 && <div className='text-sm text-slate-500 dark:text-slate-400 text-center py-8'>📭 Sin incidencias cerradas en este momento.</div>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
