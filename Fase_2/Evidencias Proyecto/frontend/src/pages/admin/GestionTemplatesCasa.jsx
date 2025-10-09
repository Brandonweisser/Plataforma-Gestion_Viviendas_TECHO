import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../../components/ui/DashboardLayout'
import { SectionPanel } from '../../components/ui/SectionPanel'

export default function GestionTemplatesCasa() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [templates, setTemplates] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('crear') // 'crear', 'editar', 'habitaciones'
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    metros_totales: '',
    numero_habitaciones: '',
    numero_banos: ''
  })
  // Builder dinámico
  const [builderOpen, setBuilderOpen] = useState(false)
  const [rooms, setRooms] = useState([]) // [{ nombre_habitacion, tipo_habitacion, metros_cuadrados, orden, items: [...] }]
  const [activeRoomIndex, setActiveRoomIndex] = useState(-1)
  const tipoHabitacionOptions = ['dormitorio','cocina','bano','living','comedor','lavadero','bodega','terraza','otro']

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/admin/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setTemplates(data.data || [])
      } else {
        setError(data.message || 'Error cargando templates')
      }
    } catch (err) {
      setError('Error de conexión al cargar templates')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setForm({
      nombre: '',
      descripcion: '',
      metros_totales: '',
      numero_habitaciones: '',
      numero_banos: ''
    })
  }

  const openModal = (type, template = null) => {
    setModalType(type)
    setSelectedTemplate(template)
    
    if (type === 'editar' && template) {
      setForm({
        nombre: template.nombre || '',
        descripcion: template.descripcion || '',
        metros_totales: template.metros_totales || '',
        numero_habitaciones: template.numero_habitaciones || '',
        numero_banos: template.numero_banos || ''
      })
    } else {
      resetForm()
    }
    
    setShowModal(true)
    setError('')
    setSuccess('')
    setBuilderOpen(false)
    setRooms([])
    setActiveRoomIndex(-1)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedTemplate(null)
    resetForm()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    setLoading(true)
    setError('')

    try {
      const formData = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        metros_totales: parseFloat(form.metros_totales),
        numero_habitaciones: parseInt(form.numero_habitaciones),
        numero_banos: parseInt(form.numero_banos)
      }

      // Builder: si hay rooms definidas, usar endpoint full
      const payload = rooms.length ? {
        template: formData,
        habitaciones: rooms.map((r, idx) => ({
          nombre_habitacion: r.nombre_habitacion,
          tipo_habitacion: r.tipo_habitacion,
          metros_cuadrados: parseFloat(r.metros_cuadrados),
          orden: r.orden ?? (idx + 1),
          items: (r.items || []).map((it, j) => ({
            nombre_item: it.nombre_item,
            tipo_input: it.tipo_input,
            opciones: it.opciones || [],
            obligatorio: it.obligatorio !== false,
            categoria: it.categoria || 'general',
            orden: it.orden ?? (j + 1)
          }))
        }))
      } : null

      const url = modalType === 'crear' && rooms.length
        ? '/api/admin/templates/full'
        : (modalType === 'crear' ? '/api/admin/templates' : `/api/admin/templates/${selectedTemplate.id}`)
      const method = modalType === 'crear' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload || formData)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(modalType === 'crear' ? 'Template creado exitosamente' : 'Template actualizado exitosamente')
        closeModal()
        await loadTemplates()
      } else {
        setError(data.message || 'Error al procesar la solicitud')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  // ---------- Builder helpers ----------
  const addRoom = () => {
    const next = [...rooms, {
      nombre_habitacion: '',
      tipo_habitacion: 'dormitorio',
      metros_cuadrados: '',
      orden: rooms.length + 1,
      items: []
    }]
    setRooms(next)
    setActiveRoomIndex(next.length - 1)
  }
  const updateRoom = (idx, patch) => {
    setRooms(rs => rs.map((r,i) => i===idx ? { ...r, ...patch } : r))
  }
  const removeRoom = (idx) => {
    setRooms(rs => rs.filter((_,i)=>i!==idx).map((r,i)=>({ ...r, orden: i+1 })))
    if (activeRoomIndex === idx) setActiveRoomIndex(-1)
  }
  const addItemToRoom = (idx) => {
    setRooms(rs => rs.map((r,i)=> i===idx ? {
      ...r,
      items: [...(r.items||[]), {
        nombre_item: '',
        tipo_input: 'select',
        opciones: ["Excelente","Bueno","Regular","Malo"],
        obligatorio: true,
        categoria: 'general',
        orden: (r.items?.length || 0) + 1
      }]
    } : r))
  }
  const updateItem = (rIdx, itIdx, patch) => {
    setRooms(rs => rs.map((r,i)=> i===rIdx ? {
      ...r,
      items: r.items.map((it,j)=> j===itIdx ? { ...it, ...patch } : it)
    } : r))
  }
  const removeItem = (rIdx, itIdx) => {
    setRooms(rs => rs.map((r,i)=> i===rIdx ? {
      ...r,
      items: r.items.filter((_,j)=> j!==itIdx).map((it,j)=>({ ...it, orden: j+1 }))
    } : r))
  }

  const handleDelete = async (template) => {
    if (!window.confirm(`¿Está seguro de desactivar el template "${template.nombre}"?`)) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/templates/${template.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Template desactivado exitosamente')
        await loadTemplates()
      } else {
        setError(data.message || 'Error al desactivar template')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  if (loading && templates.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando templates...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Gestión de Templates de Casa
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">
                Crear y gestionar tipos de vivienda con especificaciones profesionales
              </p>
            </div>
            <button 
              onClick={() => openModal('crear')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Nuevo Template
            </button>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Lista de Templates */}
        <SectionPanel title="Templates de Casa" description="Tipos de vivienda configurados">
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No hay templates registrados</p>
              <button 
                onClick={() => openModal('crear')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crear Primer Template
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {templates.map(template => (
                <div key={template.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {template.nombre}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {template.descripcion || 'Sin descripción'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openModal('editar', template)}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(template)}
                        className="px-2 py-1 text-xs border border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Desactivar
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>Metros totales:</span>
                      <span className="font-medium">{template.metros_totales}m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Habitaciones:</span>
                      <span className="font-medium">{template.numero_habitaciones}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Baños:</span>
                      <span className="font-medium">{template.numero_banos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Habitaciones detalladas:</span>
                      <span className="font-medium">{template.habitaciones?.length || 0}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => navigate(`/admin/templates/${template.id}/habitaciones`)}
                      className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      Gestionar Habitaciones
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionPanel>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {modalType === 'crear' ? 'Crear Nuevo Template' : 'Editar Template'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre del Template *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300"
                    placeholder="Ej: Casa 2D Estándar"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300"
                    placeholder="Descripción del tipo de casa"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Metros Totales *
                    </label>
                    <input
                      type="number"
                      name="metros_totales"
                      value={form.metros_totales}
                      onChange={handleInputChange}
                      step="0.1"
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Habitaciones *
                    </label>
                    <input
                      type="number"
                      name="numero_habitaciones"
                      value={form.numero_habitaciones}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Número de Baños *
                  </label>
                  <input
                    type="number"
                    name="numero_banos"
                    value={form.numero_banos}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300"
                    required
                  />
                </div>

                {/* Builder Toggle */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setBuilderOpen(v=>!v)}
                    className="px-3 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {builderOpen ? 'Ocultar Constructor' : 'Abrir Constructor de Habitaciones'}
                  </button>
                </div>

                {builderOpen && (
                  <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Habitaciones</h4>
                      <button type="button" onClick={addRoom} className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Agregar Habitación</button>
                    </div>

                    {/* Rooms list */}
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {rooms.length === 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">No hay habitaciones. Agrega la primera.</p>
                      )}
                      {rooms.map((r, idx) => (
                        <div key={idx} className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">#{idx+1}</span>
                              <input
                                value={r.nombre_habitacion}
                                onChange={e=>updateRoom(idx, { nombre_habitacion: e.target.value })}
                                placeholder="Nombre de la habitación"
                                className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                              />
                              <select
                                value={r.tipo_habitacion}
                                onChange={e=>updateRoom(idx, { tipo_habitacion: e.target.value })}
                                className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                              >
                                {tipoHabitacionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                              <input
                                type="number"
                                value={r.metros_cuadrados}
                                onChange={e=>updateRoom(idx, { metros_cuadrados: e.target.value })}
                                placeholder="m²"
                                min="0.1"
                                step="0.1"
                                className="w-24 text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={()=>setActiveRoomIndex(idx)} className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">Items</button>
                              <button type="button" onClick={()=>removeRoom(idx)} className="text-xs px-2 py-1 rounded border border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">Eliminar</button>
                            </div>
                          </div>
                          {/* Items editor (visible si activa) */}
                          {activeRoomIndex === idx && (
                            <div className="p-3 space-y-2 bg-gray-50 dark:bg-gray-900/20">
                              <div className="flex items-center justify-between">
                                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Items de Formulario</h5>
                                <button type="button" onClick={()=>addItemToRoom(idx)} className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">Agregar Item</button>
                              </div>
                              {(r.items||[]).length === 0 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">No hay items. Agrega el primero.</p>
                              )}
                              {(r.items||[]).map((it, itIdx) => (
                                <div key={itIdx} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
                                  <input
                                    value={it.nombre_item}
                                    onChange={e=>updateItem(idx, itIdx, { nombre_item: e.target.value })}
                                    placeholder="Nombre del item"
                                    className="md:col-span-2 text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                                  />
                                  <select
                                    value={it.tipo_input}
                                    onChange={e=>updateItem(idx, itIdx, { tipo_input: e.target.value })}
                                    className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                                  >
                                    <option value="select">select</option>
                                    <option value="text">text</option>
                                    <option value="checkbox">checkbox</option>
                                    <option value="rating">rating</option>
                                    <option value="textarea">textarea</option>
                                  </select>
                                  <input
                                    value={(it.opciones||[]).join(', ')}
                                    onChange={e=>updateItem(idx, itIdx, { opciones: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) })}
                                    placeholder="Opciones (coma)"
                                    className="md:col-span-2 text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                                  />
                                  <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                                    <input type="checkbox" checked={it.obligatorio !== false} onChange={e=>updateItem(idx, itIdx, { obligatorio: e.target.checked })} /> Obligatorio
                                  </label>
                                  <button type="button" onClick={()=>removeItem(idx, itIdx)} className="text-xs px-2 py-1 rounded border border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">Eliminar</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Procesando...' : modalType === 'crear' ? 'Crear Template' : 'Actualizar Template'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}