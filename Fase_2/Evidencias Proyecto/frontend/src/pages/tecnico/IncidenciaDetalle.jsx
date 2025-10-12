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
  const [editMode, setEditMode] = useState(false)
  const [editDescripcion, setEditDescripcion] = useState('')
  const [editPrioridad, setEditPrioridad] = useState('')
  const [comentarioNuevo, setComentarioNuevo] = useState('')
  const [subiendo, setSubiendo] = useState(false)

  console.log('🔍 IncidenciaDetalleTecnico - ID:', id)
  console.log('🔍 IncidenciaDetalleTecnico - Componente cargado')

  async function loadAll() {
    setLoading(true); setError('')
    console.log('📡 Iniciando carga de datos para incidencia ID:', id)
    
    try {
      console.log('📡 Llamando a tecnicoApi.detalleIncidencia...')
      const det = await tecnicoApi.detalleIncidencia(id)
      console.log('✅ Detalle obtenido:', det)
      setData(det.data)
      
      console.log('📡 Llamando a tecnicoApi.historialIncidencia...')
      const hist = await tecnicoApi.historialIncidencia(id)
      console.log('✅ Historial obtenido:', hist)
      setHistorial(hist.data || [])
      setNuevoEstado(det.data?.estado || '')
      setEditDescripcion(det.data?.descripcion || '')
      setEditPrioridad(det.data?.prioridad || '')
    } catch (e) { 
      console.error('❌ Error cargando datos:', e)
      setError(e.message || 'Error cargando') 
    } finally { 
      setLoading(false) 
    }
  }
  useEffect(() => { 
    console.log('🔄 useEffect ejecutado - cargando datos...')
    loadAll() // eslint-disable-next-line
  }, [id])

  async function handleEstado() {
    if (!nuevoEstado) return
    try { await tecnicoApi.cambiarEstadoIncidencia(id, nuevoEstado, comentario); setAccionMsg('Estado actualizado'); setComentario(''); loadAll() } catch(e) { setAccionMsg(e.message) }
  }

  async function handleEditar() {
    try {
      await tecnicoApi.editarIncidencia(id, { descripcion: editDescripcion, prioridad: editPrioridad })
      setAccionMsg('Incidencia actualizada')
      setEditMode(false)
      loadAll()
    } catch(e) { setAccionMsg(e.message) }
  }

  async function handleComentar() {
    if (!comentarioNuevo.trim()) return
    try {
      await tecnicoApi.comentarIncidencia(id, comentarioNuevo.trim())
      setComentarioNuevo('')
      loadAll()
    } catch(e){ setAccionMsg(e.message) }
  }

  async function handleSubirMedia(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setSubiendo(true)
    try {
      await tecnicoApi.subirMediaIncidencia(id, file)
      setAccionMsg('Media subida')
      loadAll()
    } catch(err){ setAccionMsg(err.message) }
    finally { setSubiendo(false); e.target.value = '' }
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
              <div>
                <span className='font-medium'>Descripción:</span><br />
                {!editMode && <span>{data.descripcion}</span>}
                {editMode && (
                  <textarea className='input w-full h-28' value={editDescripcion} onChange={e=>setEditDescripcion(e.target.value)} />
                )}
              </div>
              <div><span className='font-medium'>Estado:</span> {data.estado}</div>
              <div><span className='font-medium'>Categoría:</span> {data.categoria || '—'}</div>
              <div>
                <span className='font-medium'>Prioridad:</span>{' '}
                {!editMode && (data.prioridad || '').toUpperCase()}
                {editMode && (
                  <select className='input' value={editPrioridad} onChange={e=>setEditPrioridad(e.target.value)}>
                    <option value='baja'>baja</option>
                    <option value='media'>media</option>
                    <option value='alta'>alta</option>
                  </select>
                )}
              </div>
              <div><span className='font-medium'>Asignada a:</span> {data.id_usuario_tecnico || '—'}</div>
              <div><span className='font-medium'>Fecha reporte:</span> {(data.fecha_reporte||'').split('T')[0]}</div>
              {data.beneficiario && (
                <div className='md:col-span-2'>
                  <span className='font-medium'>Beneficiario:</span>{' '}
                  {data.beneficiario.nombre} (RUT: {data.beneficiario.rut})
                </div>
              )}
            </div>
              <div className='mt-4 flex flex-wrap gap-2'>
              {/* Solo el admin asigna incidencias; no mostrar auto-asignación al técnico */}
              {!editMode && <button className='btn btn-secondary' onClick={()=>setEditMode(true)}>Editar</button>}
              {editMode && (
                <>
                  <button className='btn btn-success' onClick={handleEditar}>Guardar</button>
                  <button className='btn btn-ghost' onClick={()=>{ setEditMode(false); setEditDescripcion(data.descripcion); setEditPrioridad(data.prioridad); }}>Cancelar</button>
                </>
              )}
            </div>
            <div className='mt-6'>
              <h4 className='font-semibold mb-2'>Acciones de estado</h4>
              <div className='flex flex-wrap gap-3 items-end'>
                <select className='input' value={nuevoEstado} onChange={e=>setNuevoEstado(e.target.value)}>
                  <option value=''>-- estado --</option>
                  <option value='abierta'>Abierta</option>
                  <option value='en_proceso'>En proceso</option>
                  <option value='resuelta'>Resuelta</option>
                  <option value='cerrada'>Cerrada</option>
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
              <div className='mt-2'>
                <label className='btn btn-sm cursor-pointer'>
                  {subiendo ? 'Subiendo...' : 'Subir foto'}
                  <input type='file' className='hidden' disabled={subiendo} onChange={handleSubirMedia} />
                </label>
              </div>
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
          <div className='mt-4'>
            <h4 className='font-semibold mb-2'>Agregar comentario</h4>
            <div className='flex gap-2 flex-wrap items-start'>
              <textarea className='input w-80 h-24' value={comentarioNuevo} onChange={e=>setComentarioNuevo(e.target.value)} placeholder='Comentario técnico...' />
              <button className='btn btn-secondary' onClick={handleComentar}>Enviar</button>
            </div>
          </div>
        </SectionPanel>
      </div>
    </DashboardLayout>
  )
}
