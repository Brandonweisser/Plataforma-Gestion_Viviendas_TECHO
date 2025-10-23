import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/ui/DashboardLayout'
import { SectionPanel } from '../../components/ui/SectionPanel'
import { adminApi } from '../../services/api'

export default function GestionTemplatesPosventa() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [templates, setTemplates] = useState([])
  const [activeTemplateId, setActiveTemplateId] = useState(null)
  const [items, setItems] = useState([])
  const [rooms, setRooms] = useState([])
  const [files, setFiles] = useState([])
  const [newTpl, setNewTpl] = useState({ nombre: '', tipo_vivienda: '' })
  // Rooms and items state
  const [newRoom, setNewRoom] = useState({ nombre: '' })
  const [expandedRooms, setExpandedRooms] = useState([]) // ids de rooms expandidas
  const [newItemByRoom, setNewItemByRoom] = useState({}) // { [roomId|'none']: string }
  const [editingItemId, setEditingItemId] = useState(null)
  const [editingItemName, setEditingItemName] = useState('')

  useEffect(() => { loadTemplates() }, [])

  async function loadTemplates() {
    setLoading(true); setError(''); setSuccess('')
    try {
      const r = await adminApi.listarTemplates()
      setTemplates(r.data || [])
    } catch (e) { setError(e.message || 'Error cargando templates') }
    finally { setLoading(false) }
  }

  async function selectTemplate(id) {
    setActiveTemplateId(id)
    setItems([]); setRooms([]); setFiles([]); setError(''); setSuccess('')
    if (!id) return
    try {
      const [ri, rr, rf] = await Promise.all([
        adminApi.listarItemsTemplate(id),
        adminApi.listarRooms(id),
        adminApi.listarArchivosTemplate(id)
      ])
      setItems(ri.data || [])
      setRooms(rr.data || [])
      setFiles(rf.data || [])
    } catch (e) { setError(e.message || 'Error cargando items') }
  }

  async function handleCreateTemplate(e) {
    e.preventDefault()
    if (!newTpl.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setLoading(true); setError(''); setSuccess('')
    try {
      const r = await adminApi.crearTemplate({ nombre: newTpl.nombre.trim(), tipo_vivienda: newTpl.tipo_vivienda || null })
      setSuccess('Template creado')
      setNewTpl({ nombre: '', tipo_vivienda: '' })
      await loadTemplates()
      await selectTemplate(r.data?.id)
    } catch (e) { setError(e.message || 'Error creando template') }
    finally { setLoading(false) }
  }

  async function addItemToRoom(roomId) {
    if (!activeTemplateId) { setError('Seleccione un template primero'); return }
    const key = roomId || 'none'
    const name = (newItemByRoom[key] || '').trim()
    if (!name) { setError('El nombre del ítem es obligatorio'); return }
    setLoading(true); setError(''); setSuccess('')
    try {
      const payload = [{ item: name, room_id: roomId || null }]
      await adminApi.agregarItemsTemplate(activeTemplateId, payload)
      setSuccess('Ítem agregado')
      setNewItemByRoom(s => ({ ...s, [key]: '' }))
      await selectTemplate(activeTemplateId)
    } catch (e) { setError(e.message || 'Error agregando ítem') }
    finally { setLoading(false) }
  }

  async function handleDeleteItem(id) {
    if (!activeTemplateId) return
    if (!window.confirm('¿Eliminar este ítem?')) return
    setLoading(true); setError(''); setSuccess('')
    try {
      await adminApi.eliminarItemTemplate(activeTemplateId, id)
      setSuccess('Ítem eliminado')
      await selectTemplate(activeTemplateId)
    } catch (e) { setError(e.message || 'Error eliminando ítem') }
    finally { setLoading(false) }
  }

  async function handleToggleActive(tpl) {
    setLoading(true); setError(''); setSuccess('')
    try {
      await adminApi.actualizarTemplate(tpl.id, { activo: !tpl.activo })
      setSuccess(!tpl.activo ? 'Template activado' : 'Template desactivado')
      await loadTemplates()
    } catch (e) { setError(e.message || 'Error actualizando template') }
    finally { setLoading(false) }
  }

  async function handleCreateRoom(e) {
    e.preventDefault()
    if (!activeTemplateId) { setError('Seleccione un template primero'); return }
    if (!newRoom.nombre.trim()) { setError('El nombre de la habitación es obligatorio'); return }
    setLoading(true); setError(''); setSuccess('')
    try {
      await adminApi.crearRoom(activeTemplateId, { nombre: newRoom.nombre.trim() })
      setSuccess('Habitación creada')
      setNewRoom({ nombre: '' })
      const rr = await adminApi.listarRooms(activeTemplateId)
      setRooms(rr.data || [])
    } catch (e) { setError(e.message || 'Error creando habitación') }
    finally { setLoading(false) }
  }

  async function handleUpdateItemSave() {
    if (!activeTemplateId || !editingItemId) return
    setLoading(true); setError(''); setSuccess('')
    try {
      await adminApi.actualizarItemTemplate(activeTemplateId, editingItemId, { item: editingItemName })
      setSuccess('Ítem actualizado')
      setEditingItemId(null)
      const ri = await adminApi.listarItemsTemplate(activeTemplateId)
      setItems(ri.data || [])
    } catch (e) { setError(e.message || 'Error actualizando ítem') }
    finally { setLoading(false) }
  }

  async function handleDeleteRoom(id) {
    if (!activeTemplateId) return
    if (!window.confirm('Eliminar esta habitación? Los ítems quedarán sin habitación.')) return
    setLoading(true); setError(''); setSuccess('')
    try {
      await adminApi.eliminarRoom(activeTemplateId, id)
      const rr = await adminApi.listarRooms(activeTemplateId)
      setRooms(rr.data || [])
    } catch (e) { setError(e.message || 'Error eliminando habitación') }
    finally { setLoading(false) }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Templates de Postventa</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">Crea, activa/desactiva y administra los ítems de las listas de chequeo por tipo de vivienda.</p>
            </div>
            {loading && <span className="text-sm text-gray-500">Cargando…</span>}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}

  <SectionPanel title="Crear nuevo template" description="Define un nombre y opcionalmente un tipo de vivienda (ej. A1, 2B, 3C)" showBack={false}>
          <form onSubmit={handleCreateTemplate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input className="w-full px-3 py-2 border rounded-lg" value={newTpl.nombre} onChange={e=>setNewTpl(s=>({...s, nombre:e.target.value}))} placeholder="Template Posventa B3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de vivienda (opcional)</label>
              <input className="w-full px-3 py-2 border rounded-lg" value={newTpl.tipo_vivienda} onChange={e=>setNewTpl(s=>({...s, tipo_vivienda:e.target.value}))} placeholder="A1 / 2B / 3C / B3" />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={loading} className={`px-4 py-2 rounded-lg text-white ${loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>Crear</button>
            </div>
          </form>
        </SectionPanel>

  <SectionPanel title="Templates" description="Selecciona un template para gestionar habitaciones, ítems y planos" showBack={false}>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {(templates || []).map(tpl => (
                <div key={tpl.id} className={`border rounded-lg p-3 flex items-center justify-between ${activeTemplateId===tpl.id ? 'border-blue-400' : 'border-gray-200 dark:border-gray-700'}`}>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{tpl.nombre}</div>
                    <div className="text-xs text-gray-500">Tipo: {tpl.tipo_vivienda || 'General'} · Versión {tpl.version} · {tpl.activo ? 'Activo' : 'Inactivo'}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-2 py-1 text-xs border rounded" onClick={()=>selectTemplate(tpl.id)}>Ver ítems</button>
                    <button className={`px-2 py-1 text-xs rounded ${tpl.activo ? 'bg-amber-100 text-amber-800' : 'bg-green-600 text-white'}`} onClick={()=>handleToggleActive(tpl)}>{tpl.activo ? 'Desactivar' : 'Activar'}</button>
                  </div>
                </div>
              ))}
              {!templates?.length && <div className="text-sm text-gray-500">No hay templates aún</div>}
            </div>

            <div className="space-y-4">
              {/* Gestión de habitaciones e items por habitación */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Habitaciones del template</h3>
                {!activeTemplateId && <div className="text-sm text-gray-500">Seleccione un template para ver sus habitaciones</div>}
                {activeTemplateId && (
                  <>
                    <ul className="divide-y">
                      {(rooms || []).map(r => {
                        const expanded = expandedRooms.includes(r.id)
                        const roomItems = items.filter(it=>it.room_id===r.id)
                        return (
                          <li key={r.id} className="py-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">{r.nombre}</div>
                              </div>
                              <div className="flex gap-2">
                                <button className="px-2 py-1 text-xs border rounded" onClick={()=>setExpandedRooms(s=>expanded? s.filter(id=>id!==r.id): [...s, r.id])}>{expanded? 'Ocultar items' : 'Editar items'}</button>
                                <button className="px-2 py-1 text-xs border rounded" onClick={()=>handleDeleteRoom(r.id)}>Eliminar</button>
                              </div>
                            </div>
                            {expanded && (
                              <div className="mt-2 pl-3 border-l border-gray-200 dark:border-gray-700 space-y-2">
                                {/* Nuevo item en esta habitación */}
                                <div className="flex gap-2">
                                  <input className="px-3 py-2 border rounded w-full" placeholder="Nombre del ítem" value={newItemByRoom[r.id] || ''} onChange={e=>setNewItemByRoom(s=>({...s, [r.id]: e.target.value}))} />
                                  <button className="px-3 py-2 rounded bg-blue-600 text-white" disabled={loading} onClick={()=>addItemToRoom(r.id)}>Agregar ítem</button>
                                </div>
                                {/* Lista de items */}
                                <ul className="divide-y">
                                  {roomItems.map(it => (
                                    <li key={it.id} className="py-2 flex items-start justify-between gap-3">
                                      {editingItemId===it.id ? (
                                        <div className="w-full flex gap-2">
                                          <input className="px-2 py-1 border rounded w-full" value={editingItemName} onChange={e=>setEditingItemName(e.target.value)} />
                                          <button className="px-3 py-1 text-xs rounded bg-green-600 text-white" onClick={handleUpdateItemSave}>Guardar</button>
                                          <button className="px-3 py-1 text-xs border rounded" onClick={()=>setEditingItemId(null)}>Cancelar</button>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="text-sm text-gray-900 dark:text-gray-100">{it.item}</div>
                                          <div className="flex gap-2">
                                            <button className="px-2 py-1 text-xs border rounded" onClick={()=>{ setEditingItemId(it.id); setEditingItemName(it.item || '') }}>Editar</button>
                                            <button className="px-2 py-1 text-xs border border-red-300 text-red-700 rounded" onClick={()=>handleDeleteItem(it.id)}>Eliminar</button>
                                          </div>
                                        </>
                                      )}
                                    </li>
                                  ))}
                                  {!roomItems.length && <li className="py-2 text-sm text-gray-500">Aún no hay ítems en esta habitación</li>}
                                </ul>
                              </div>
                            )}
                          </li>
                        )
                      })}
                    </ul>

                    {/* Se oculta la sección de items sin habitación por requerimiento */}
                  </>
                )}
              </div>

              {/* Crear habitación */}
              <form onSubmit={handleCreateRoom} className="border rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <input placeholder="Nombre de la habitación" className="px-3 py-2 border rounded md:col-span-2" value={newRoom.nombre} onChange={e=>setNewRoom(s=>({...s, nombre:e.target.value}))} />
                <div className="flex items-center">
                  <button type="submit" disabled={loading} className={`px-4 py-2 rounded text-white ${loading ? 'bg-emerald-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}>Agregar habitación</button>
                </div>
              </form>
            </div>
          </div>
        </SectionPanel>

        {/* Planos del template */}
        <SectionPanel title="Planos del template" description="Adjunta el plano (PDF, DWG o imagen) asociado a este template" showBack={false}>
          {!activeTemplateId && <div className="text-sm text-gray-500">Seleccione un template para gestionar sus planos</div>}
          {activeTemplateId && (
            <>
              <div className="flex items-center gap-3 mb-3">
                <input type="file" accept=".pdf,.dwg,.png,.jpg,.jpeg" onChange={async (e)=>{
                  const f = e.target.files?.[0]; if (!f) return;
                  setLoading(true); setError(''); setSuccess('')
                  try {
                    await adminApi.subirArchivoTemplate(activeTemplateId, f)
                    const rf = await adminApi.listarArchivosTemplate(activeTemplateId)
                    setFiles(rf.data || [])
                    setSuccess('Archivo subido')
                  } catch (er) { setError(er.message || 'Error subiendo archivo') }
                  finally { setLoading(false); e.target.value = '' }
                }} />
              </div>
              <ul className="divide-y">
                {(files||[]).map(f => (
                  <li key={f.id} className="py-2 flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-200 truncate">{f.url.split('/').pop()}</div>
                    <a className="text-blue-600 text-sm" href={f.url} target="_blank" rel="noreferrer">Ver/Descargar</a>
                  </li>
                ))}
                {(!files||!files.length) && <li className="py-2 text-sm text-gray-500">Aún no hay archivos</li>}
              </ul>
            </>
          )}
        </SectionPanel>
      </div>
    </DashboardLayout>
  )
}
