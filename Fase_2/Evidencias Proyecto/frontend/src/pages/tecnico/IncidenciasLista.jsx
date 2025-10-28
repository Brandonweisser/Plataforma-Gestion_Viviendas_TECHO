import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { DashboardLayout } from '../../components/ui/DashboardLayout'
import { SectionPanel } from '../../components/ui/SectionPanel'
import CardIncidencia from '../../components/CardIncidencia'
import { tecnicoApi } from '../../services/api'

export default function IncidenciasListaTecnico() {
  const location = useLocation()
  const [incidencias, setIncidencias] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ search: '', prioridad: '', asignacion: 'all', plazo: '' })
  const [filtersCerradas, setFiltersCerradas] = useState({ search: '', prioridad: '', asignacion: 'all' })

  // Derivar filtros iniciales desde la URL (?asignacion=asignadas&prioridad=alta)
  const initialFromQuery = useMemo(() => {
    const p = new URLSearchParams(location.search)
    const asignacion = p.get('asignacion') || ''
    const prioridad = p.get('prioridad') || ''
    const plazo = p.get('plazo') || ''
    const normalized = {
      ...(asignacion ? { asignacion } : {}),
      ...(prioridad ? { prioridad } : {}),
      ...(plazo ? { plazo } : {})
    }
    return normalized
  }, [location.search])

  async function load(offset = 0) {
    setLoading(true); setError('')
    try {
      const r = await tecnicoApi.listarIncidencias({ offset, search: filters.search, prioridad: filters.prioridad, asignacion: filters.asignacion })
      let data = r.data || []
      
      // Filtrado client-side por estado_plazo
      if (filters.plazo) {
        data = data.filter(inc => inc.plazos_legales?.estado_plazo === filters.plazo)
      }
      
      setIncidencias(data)
    } catch (e) {
      setError(e.message || 'Error cargando incidencias')
    } finally { setLoading(false) }
  }

  // Separar incidencias activas y cerradas
  const incidenciasActivas = useMemo(() => {
    return incidencias.filter(inc => !['cerrada', 'cancelada', 'descartada'].includes((inc.estado || '').toLowerCase()))
  }, [incidencias])

  const incidenciasCerradas = useMemo(() => {
    let cerradas = incidencias.filter(inc => ['cerrada', 'cancelada', 'descartada'].includes((inc.estado || '').toLowerCase()))
    
    // Aplicar filtros de cerradas
    if (filtersCerradas.search) {
      cerradas = cerradas.filter(inc => (inc.descripcion || '').toLowerCase().includes(filtersCerradas.search.toLowerCase()))
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

  // Aplicar filtros de la URL una única vez por cambio de querystring
  useEffect(() => {
    if (Object.keys(initialFromQuery).length) {
      setFilters(f => ({ ...f, ...initialFromQuery }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFromQuery])

  useEffect(() => { load(0) // eslint-disable-next-line
  }, [filters.search, filters.prioridad, filters.asignacion, filters.plazo])

  return (
    <DashboardLayout title='Incidencias' subtitle='Visión global' accent='orange'>
      <div className='space-y-6'>
        {/* Filtros para Incidencias Activas */}
        <SectionPanel title='Filtros - Incidencias Activas' description='Refina la búsqueda'>
          <div className='flex flex-wrap items-end gap-4'>
            <div className='flex flex-col'>
              <label className='text-xs font-medium text-techo-gray-600'>Buscar</label>
              <input className='input' value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} placeholder='Texto en descripción' />
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
            <button className='btn btn-secondary mt-4' onClick={() => load(0)} disabled={loading}>Refrescar</button>
          </div>
        </SectionPanel>

        {/* Listado Incidencias Activas */}
        <SectionPanel title='Incidencias Activas' description={`Total activas: ${incidenciasActivas.length}`}>        
          {loading && <div className='text-sm text-techo-gray-500'>Cargando...</div>}
          {error && <div className='text-sm text-red-600'>{error}</div>}
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
            {incidenciasActivas.map(i => (
              <CardIncidencia key={i.id_incidencia} incidencia={i} onOpen={() => window.location.href = `/tecnico/incidencias/${i.id_incidencia}`} />
            ))}
          </div>
          {!loading && incidenciasActivas.length === 0 && <div className='text-sm text-techo-gray-500'>Sin incidencias activas.</div>}
        </SectionPanel>

        {/* Filtros para Incidencias Cerradas */}
        <SectionPanel title='Filtros - Incidencias Cerradas/Terminadas' description='Filtra incidencias finalizadas'>
          <div className='flex flex-wrap items-end gap-4'>
            <div className='flex flex-col'>
              <label className='text-xs font-medium text-techo-gray-600'>Buscar</label>
              <input className='input' value={filtersCerradas.search} onChange={e => setFiltersCerradas(f => ({ ...f, search: e.target.value }))} placeholder='Texto en descripción' />
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
        <SectionPanel title='Incidencias Cerradas/Terminadas' description={`Total cerradas: ${incidenciasCerradas.length}`}>        
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
            {incidenciasCerradas.map(i => (
              <CardIncidencia key={i.id_incidencia} incidencia={i} onOpen={() => window.location.href = `/tecnico/incidencias/${i.id_incidencia}`} />
            ))}
          </div>
          {incidenciasCerradas.length === 0 && <div className='text-sm text-techo-gray-500'>Sin incidencias cerradas.</div>}
        </SectionPanel>
      </div>
    </DashboardLayout>
  )
}
