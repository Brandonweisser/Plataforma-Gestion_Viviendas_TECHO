import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { DashboardLayout } from '../../components/ui/DashboardLayout'
import { SectionPanel } from '../../components/ui/SectionPanel'
import CardIncidencia from '../../components/CardIncidencia'
import { tecnicoApi } from '../../services/api'

export default function IncidenciasListaTecnico() {
  const location = useLocation()
  const [incidencias, setIncidencias] = useState([])
  const [meta, setMeta] = useState({ total: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ search: '', estado: '', prioridad: '', asignacion: 'all', plazo: '' })

  // Derivar filtros iniciales desde la URL (?estado=abierta&asignacion=asignadas)
  const initialFromQuery = useMemo(() => {
    const p = new URLSearchParams(location.search)
    const estado = p.get('estado') || ''
    const asignacion = p.get('asignacion') || ''
    const prioridad = p.get('prioridad') || ''
    const plazo = p.get('plazo') || ''
    const normalized = {
      ...(estado ? { estado } : {}),
      ...(asignacion ? { asignacion } : {}),
      ...(prioridad ? { prioridad } : {}),
      ...(plazo ? { plazo } : {})
    }
    return normalized
  }, [location.search])

  async function load(offset = 0) {
    setLoading(true); setError('')
    try {
      const r = await tecnicoApi.listarIncidencias({ offset, search: filters.search, estado: filters.estado, prioridad: filters.prioridad, asignacion: filters.asignacion })
      let data = r.data || []
      
      // Filtrado client-side por estado_plazo
      if (filters.plazo) {
        data = data.filter(inc => inc.plazos_legales?.estado_plazo === filters.plazo)
      }
      
      setIncidencias(data)
      setMeta(r.meta || {})
    } catch (e) {
      setError(e.message || 'Error cargando incidencias')
    } finally { setLoading(false) }
  }

  // Aplicar filtros de la URL una única vez por cambio de querystring
  useEffect(() => {
    if (Object.keys(initialFromQuery).length) {
      setFilters(f => ({ ...f, ...initialFromQuery }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFromQuery])

  useEffect(() => { load(0) // eslint-disable-next-line
  }, [filters.search, filters.estado, filters.prioridad, filters.asignacion, filters.plazo])

  return (
    <DashboardLayout title='Incidencias' subtitle='Visión global' accent='orange'>
      <div className='space-y-6'>
        <SectionPanel title='Filtros' description='Refina la búsqueda'>
          <div className='flex flex-wrap items-end gap-4'>
            <div className='flex flex-col'>
              <label className='text-xs font-medium text-techo-gray-600'>Buscar</label>
              <input className='input' value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} placeholder='Texto en descripción' />
            </div>
            <div className='flex flex-col'>
              <label className='text-xs font-medium text-techo-gray-600'>Estado</label>
              <select className='input' value={filters.estado} onChange={e => setFilters(f => ({ ...f, estado: e.target.value }))}>
                <option value=''>Todos</option>
                <option value='abierta'>Abierta</option>
                <option value='en_proceso'>En proceso</option>
                <option value='en_espera'>En espera</option>
                <option value='resuelta'>Resuelta</option>
                <option value='cerrada'>Cerrada</option>
                <option value='descartada'>Descartada</option>
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
        <SectionPanel title='Listado' description={`Total: ${meta.total || 0}`}>        
          {loading && <div className='text-sm text-techo-gray-500'>Cargando...</div>}
          {error && <div className='text-sm text-red-600'>{error}</div>}
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
            {incidencias.map(i => (
              <CardIncidencia key={i.id_incidencia} incidencia={i} onOpen={() => window.location.href = `/tecnico/incidencias/${i.id_incidencia}`} />
            ))}
          </div>
          {!loading && incidencias.length === 0 && <div className='text-sm text-techo-gray-500'>Sin resultados.</div>}
        </SectionPanel>
      </div>
    </DashboardLayout>
  )
}
