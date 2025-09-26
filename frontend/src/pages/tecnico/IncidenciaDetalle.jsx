import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../../components/ui/DashboardLayout'
import { SectionPanel } from '../../components/ui/SectionPanel'
import { tecnicoApi } from '../../services/api'

export default function IncidenciaDetalleTecnico() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [comentario, setComentario] = useState('')
  const [accionMsg, setAccionMsg] = useState('')

  async function loadAll() {
    setLoading(true); setError('')
    try {
      const det = await tecnicoApi.detalleIncidencia(id)
      setData(det.data)
      const hist = await tecnicoApi.historialIncidencia(id)
      setHistorial(hist.data || [])
      setNuevoEstado(det.data?.estado || '')
    } catch (e) { setError(e.message || 'Error cargando') } finally { setLoading(false) }
  }
  useEffect(() => { loadAll() // eslint-disable-next-line
  }, [id])

  async function handleAsignar() {
    try { await tecnicoApi.asignarIncidencia(id); setAccionMsg('Asignada correctamente'); loadAll() } catch(e){ setAccionMsg(e.message)}
  }
  async function handleEstado() {
    if (!nuevoEstado) return
    try { await tecnicoApi.cambiarEstadoIncidencia(id, nuevoEstado, comentario); setAccionMsg('Estado actualizado'); setComentario(''); loadAll() } catch(e) { setAccionMsg(e.message) }
  }

  return (
    <DashboardLayout title={`Incidencia #${id}`} subtitle='Detalle y gestión' accent='orange'>
      <div className='space-y-6'>
        <button className='btn btn-secondary' onClick={() => navigate(-1)}>Volver</button>
        {loading && <div>Cargando...</div>}
        {error && <div className='text-red-600'>{error}</div>}
        {data && (
          <SectionPanel title='Resumen' description='Datos principales'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
              <div><span className='font-medium'>Descripción:</span><br />{data.descripcion}</div>
              <div><span className='font-medium'>Estado:</span> {data.estado}</div>
              <div><span className='font-medium'>Categoría:</span> {data.categoria || '—'}</div>
              <div><span className='font-medium'>Prioridad:</span> {(data.prioridad || '').toUpperCase()}</div>
              <div><span className='font-medium'>Asignada a:</span> {data.id_usuario_tecnico || '—'}</div>
              <div><span className='font-medium'>Fecha reporte:</span> {(data.fecha_reporte||'').split('T')[0]}</div>
            </div>
            <div className='mt-4 flex flex-wrap gap-2'>
              {!data.id_usuario_tecnico && <button className='btn btn-primary' onClick={handleAsignar}>Asignarme</button>}
            </div>
            <div className='mt-6'>
              <h4 className='font-semibold mb-2'>Acciones de estado</h4>
              <div className='flex flex-wrap gap-3 items-end'>
                <select className='input' value={nuevoEstado} onChange={e=>setNuevoEstado(e.target.value)}>
                  <option value=''>-- estado --</option>
                  <option value='abierta'>Abierta</option>
                  <option value='en_proceso'>En proceso</option>
                  <option value='en_espera'>En espera</option>
                  <option value='resuelta'>Resuelta</option>
                  <option value='cerrada'>Cerrada</option>
                  <option value='descartada'>Descartada</option>
                </select>
                <input className='input w-64' placeholder='Comentario (opcional)' value={comentario} onChange={e=>setComentario(e.target.value)} />
                <button className='btn btn-secondary' onClick={handleEstado}>Actualizar</button>
              </div>
            </div>
            {accionMsg && <div className='text-xs text-techo-gray-500 mt-2'>{accionMsg}</div>}
            <div className='mt-6'>
              <h4 className='font-semibold mb-2'>Media</h4>
              {Array.isArray(data.media) && data.media.length>0 ? (
                <div className='flex gap-2 overflow-x-auto'>
                  {data.media.map(m => <img key={m.id} src={m.url} alt='foto' className='h-28 w-28 object-cover rounded border' />)}
                </div>
              ) : <div className='text-xs text-techo-gray-500'>Sin fotos</div>}
            </div>
          </SectionPanel>
        )}
        <SectionPanel title='Historial' description='Eventos recientes'>
          {historial.length === 0 && <div className='text-xs text-techo-gray-500'>Sin eventos</div>}
          <ul className='divide-y divide-techo-gray-100'>
            {historial.map(h => (
              <li key={h.id} className='py-2 text-xs flex justify-between gap-4'>
                <div>
                  <span className='font-medium'>{h.tipo_evento}</span>{' '}
                  {h.estado_anterior && h.estado_nuevo && (
                    <span>({h.estado_anterior} → {h.estado_nuevo})</span>
                  )}
                  {h.comentario && <span className='italic text-techo-gray-500 ml-1'>“{h.comentario}”</span>}
                </div>
                <time className='text-techo-gray-400'>{(h.created_at||'').replace('T',' ').substring(0,16)}</time>
              </li>
            ))}
          </ul>
        </SectionPanel>
      </div>
    </DashboardLayout>
  )
}
