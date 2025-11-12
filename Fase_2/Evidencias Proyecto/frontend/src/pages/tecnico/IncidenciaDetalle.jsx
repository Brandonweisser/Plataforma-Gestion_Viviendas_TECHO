import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../../components/ui/DashboardLayout'
import { SectionPanel } from '../../components/ui/SectionPanel'
import { tecnicoApi } from '../../services/api'
import ImageModal from '../../components/ui/ImageModal'
import { ClockIcon, ExclamationTriangleIcon, CheckCircleIcon, PaperClipIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'

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
  const [archivosComentario, setArchivosComentario] = useState([])
  const [subiendo, setSubiendo] = useState(false)
  const [preview, setPreview] = useState({ open: false, src: '', alt: '' })
  const [mediaPorComentario, setMediaPorComentario] = useState({})

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
      const historialData = hist.data || []
      setHistorial(historialData)
      
      // Cargar media de cada comentario
      const mediaMap = {}
      for (const h of historialData) {
        if (h.tipo_evento === 'comentario' && h.id) {
          try {
            const mediaRes = await tecnicoApi.obtenerMediaComentario(h.id)
            if (mediaRes.data && mediaRes.data.length > 0) {
              mediaMap[h.id] = mediaRes.data
            }
          } catch (err) {
            console.warn(`No se pudo cargar media para comentario ${h.id}`)
          }
        }
      }
      setMediaPorComentario(mediaMap)
      
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
    setSubiendo(true)
    try {
      if (archivosComentario.length > 0) {
        // Usar endpoint con media
        await tecnicoApi.comentarConMedia(id, comentarioNuevo.trim(), archivosComentario)
      } else {
        // Usar endpoint simple
        await tecnicoApi.comentarIncidencia(id, comentarioNuevo.trim())
      }
      setComentarioNuevo('')
      setArchivosComentario([])
      loadAll()
      setAccionMsg('Comentario agregado')
    } catch(e){ 
      setAccionMsg(e.message) 
    } finally {
      setSubiendo(false)
    }
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

            {/* Indicador de Plazos Legales */}
            {data.plazos_legales && !['cerrada', 'cancelada'].includes((data.estado || '').toLowerCase()) && (() => {
              const { estado_plazo, dias_restantes, fecha_limite_resolucion, texto_estado } = data.plazos_legales
              let Icon = ClockIcon
              let colorClasses = 'text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
              
              if (estado_plazo === 'vencido') {
                Icon = ExclamationTriangleIcon
                colorClasses = 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
              } else if (estado_plazo === 'dentro_plazo') {
                Icon = CheckCircleIcon
                colorClasses = 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
              }
              
              const textoDetalle = dias_restantes !== null
                ? (dias_restantes > 0 
                    ? `${dias_restantes} día${dias_restantes !== 1 ? 's' : ''} hábil${dias_restantes !== 1 ? 'es' : ''} restantes (hasta ${fecha_limite_resolucion})`
                    : `Plazo vencido hace ${Math.abs(dias_restantes)} día${Math.abs(dias_restantes) !== 1 ? 's' : ''} hábil${Math.abs(dias_restantes) !== 1 ? 'es' : ''}`)
                : `Plazo límite: ${fecha_limite_resolucion}`
              
              return (
                <div className={`mt-4 p-4 rounded-lg border ${colorClasses} flex items-start gap-3`}>
                  <Icon className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{texto_estado || 'Plazo Legal'}</p>
                    <p className="text-xs mt-1">{textoDetalle}</p>
                    <p className="text-xs mt-2 opacity-75">
                      Según LGUC y normativa SERVIU. Los plazos se calculan en días hábiles (lunes a viernes).
                    </p>
                  </div>
                </div>
              )
            })()}

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
                  {data.media.map(m => (
                    <img
                      key={m.id}
                      src={m.url}
                      alt='foto'
                      className='h-28 w-28 object-cover rounded border cursor-zoom-in hover:opacity-90'
                      onClick={() => setPreview({ open: true, src: m.url, alt: `Incidencia #${id}` })}
                    />
                  ))}
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
              <li key={h.id} className='py-3 text-xs'>
                <div className='flex justify-between items-start gap-4 mb-1'>
                  <div className='flex-1'>
                    <span className='font-medium text-blue-600'>{h.tipo_evento}</span>
                    {h.actor && (
                      <span className='text-gray-600 ml-2'>
                        por <strong>{h.actor.nombre}</strong> ({h.actor.rol})
                      </span>
                    )}
                  </div>
                  <time className='text-techo-gray-400 text-[10px]'>{(h.created_at||'').replace('T',' ').substring(0,16)}</time>
                </div>
                {h.estado_anterior && h.estado_nuevo && (
                  <div className='text-gray-500 ml-0 mt-1'>
                    Estado: <span className='font-medium'>{h.estado_anterior}</span> → <span className='font-medium text-green-600'>{h.estado_nuevo}</span>
                  </div>
                )}
                {h.comentario && (
                  <div className='italic text-gray-600 ml-0 mt-1 bg-gray-50 dark:bg-gray-800 p-2 rounded border-l-2 border-blue-300'>
                    "{h.comentario}"
                  </div>
                )}
                {/* Mostrar fotos/videos adjuntos al comentario */}
                {mediaPorComentario[h.id] && mediaPorComentario[h.id].length > 0 && (
                  <div className='mt-2 flex gap-2 flex-wrap'>
                    {mediaPorComentario[h.id].map((media, idx) => (
                      <div key={idx} className='relative'>
                        {media.mime?.startsWith('video/') ? (
                          <video 
                            src={media.url} 
                            className='h-20 w-20 object-cover rounded border cursor-pointer'
                            controls
                          />
                        ) : (
                          <img
                            src={media.url}
                            alt={`Adjunto ${idx + 1}`}
                            className='h-20 w-20 object-cover rounded border cursor-zoom-in hover:opacity-90'
                            onClick={() => setPreview({ open: true, src: media.url, alt: `Comentario #${h.id}` })}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className='mt-4'>
            <h4 className='font-semibold mb-2 flex items-center gap-2'>
              Agregar comentario
              {archivosComentario.length > 0 && (
                <span className='text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full'>
                  {archivosComentario.length} archivo(s)
                </span>
              )}
            </h4>
            <div className='space-y-2'>
              <textarea 
                className='input w-full h-24' 
                value={comentarioNuevo} 
                onChange={e=>setComentarioNuevo(e.target.value)} 
                placeholder='Comentario técnico...' 
              />
              
              {/* Preview de archivos seleccionados */}
              {archivosComentario.length > 0 && (
                <div className='flex gap-2 flex-wrap p-2 bg-gray-50 dark:bg-gray-800 rounded'>
                  {archivosComentario.map((file, idx) => (
                    <div key={idx} className='relative group'>
                      {file.type.startsWith('image/') && (
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={file.name}
                          className='h-16 w-16 object-cover rounded border'
                        />
                      )}
                      {file.type.startsWith('video/') && (
                        <div className='h-16 w-16 bg-gray-200 rounded border flex items-center justify-center'>
                          <PhotoIcon className='h-8 w-8 text-gray-500' />
                        </div>
                      )}
                      <button
                        onClick={() => setArchivosComentario(prev => prev.filter((_, i) => i !== idx))}
                        className='absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity'
                      >
                        <XMarkIcon className='h-3 w-3' />
                      </button>
                      <p className='text-[10px] text-gray-500 mt-1 truncate w-16'>{file.name}</p>
                    </div>
                  ))}
                </div>
              )}
              
              <div className='flex gap-2 flex-wrap items-center'>
                <button 
                  className='btn btn-secondary' 
                  onClick={handleComentar}
                  disabled={subiendo || !comentarioNuevo.trim()}
                >
                  {subiendo ? 'Enviando...' : 'Enviar comentario'}
                </button>
                
                <label className='btn btn-sm cursor-pointer'>
                  <PaperClipIcon className='h-4 w-4 mr-1' />
                  Adjuntar fotos/videos
                  <input 
                    type='file' 
                    className='hidden' 
                    multiple
                    accept='image/*,video/*'
                    disabled={subiendo}
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      if (files.length + archivosComentario.length > 5) {
                        setAccionMsg('Máximo 5 archivos por comentario')
                        return
                      }
                      setArchivosComentario(prev => [...prev, ...files])
                      e.target.value = ''
                    }}
                  />
                </label>
                
                {archivosComentario.length > 0 && (
                  <button
                    className='text-xs text-red-600 hover:underline'
                    onClick={() => setArchivosComentario([])}
                  >
                    Limpiar archivos
                  </button>
                )}
              </div>
            </div>
          </div>
        </SectionPanel>
      </div>
      <ImageModal
        open={preview.open}
        src={preview.src}
        alt={preview.alt}
        onClose={() => setPreview({ open: false, src: '', alt: '' })}
      />
    </DashboardLayout>
  )
}
