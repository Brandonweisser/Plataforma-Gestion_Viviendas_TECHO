import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../../components/ui/DashboardLayout'
import { SectionPanel } from '../../components/ui/SectionPanel'
import { Modal } from '../../components/ui/Modal'
import { adminApi } from '../../services/api'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function GestionViviendas() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [viviendas, setViviendas] = useState([])
  const [proyectos, setProyectos] = useState([])
  const [templates, setTemplates] = useState([])
  const [beneficiarios, setBeneficiarios] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('crear')
  const [selectedVivienda, setSelectedVivienda] = useState(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedForAssign, setSelectedForAssign] = useState(null)
  const [assignForm, setAssignForm] = useState({ beneficiario_uid: '' })
  const [form, setForm] = useState({
    direccion: '',
    proyecto_id: '',
    tipo_vivienda: '',
    selected_template_id: '',
    metros_cuadrados: '',
    numero_habitaciones: '',
    numero_banos: '',
    estado: 'en_construccion',
    fecha_entrega: '',
    observaciones: ''
  })

  // Filtros y estado de UI adicional
  const [filterProyecto, setFilterProyecto] = useState('all')
  const [filterEstado, setFilterEstado] = useState('all')
  const [collapsed, setCollapsed] = useState({}) // key -> bool

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    
    try {
      const [viviendasRes, proyectosRes, usuariosRes, templatesRes] = await Promise.allSettled([
        adminApi.listarViviendas(),
        adminApi.listarProyectos(),
        adminApi.listarUsuarios(),
        adminApi.listarTemplates({ activo: true })
      ])

      if (viviendasRes.status === 'fulfilled') {
        setViviendas(viviendasRes.value.data || [])
      }

      if (proyectosRes.status === 'fulfilled') {
        setProyectos(proyectosRes.value.data || [])
      }

      if (usuariosRes.status === 'fulfilled') {
        const allUsers = usuariosRes.value.data || []
        setBeneficiarios(allUsers.filter(u => u.rol === 'beneficiario'))
      }

      if (templatesRes.status === 'fulfilled') {
        setTemplates(templatesRes.value.data || [])
      }

    } catch (err) {
      setError(err.message || 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleAssignInputChange = (e) => {
    const { name, value } = e.target
    setAssignForm(prev => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setForm({
      direccion: '',
      proyecto_id: '',
      tipo_vivienda: '',
      selected_template_id: '',
      metros_cuadrados: '',
      numero_habitaciones: '',
      numero_banos: '',
      estado: 'en_construccion',
      fecha_entrega: '',
      observaciones: ''
    })
  }

  const openModal = (type, vivienda = null) => {
    setModalType(type)
    setSelectedVivienda(vivienda)
    
    if (type === 'editar' && vivienda) {
      setForm({
        direccion: vivienda.direccion || '',
        proyecto_id: vivienda.proyecto_id || '',
        tipo_vivienda: vivienda.tipo_vivienda || '',
        selected_template_id: '',
        metros_cuadrados: vivienda.metros_cuadrados || '',
        numero_habitaciones: vivienda.numero_habitaciones || '',
        numero_banos: vivienda.numero_banos || '',
        estado: vivienda.estado || 'en_construccion',
        fecha_entrega: vivienda.fecha_entrega ? vivienda.fecha_entrega.split('T')[0] : '',
        observaciones: vivienda.observaciones || ''
      })
    } else {
      resetForm()
    }
    
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedVivienda(null)
    resetForm()
  }

  const openAssignModal = (vivienda) => {
    setSelectedForAssign(vivienda)
    setAssignForm({ beneficiario_uid: vivienda.beneficiario_uid || '' })
    setShowAssignModal(true)
    setError('')
    setSuccess('')
  }

  const closeAssignModal = () => {
    setShowAssignModal(false)
    setSelectedForAssign(null)
    setAssignForm({ beneficiario_uid: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!form.direccion.trim()) {
      setError('La dirección es obligatoria')
      return
    }
    if (modalType === 'crear' && !form.proyecto_id) {
      setError('Debe seleccionar un proyecto')
      return
    }
    if (modalType === 'crear' && !form.selected_template_id) {
      setError('Debe seleccionar un template activo de posventa')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Si el usuario seleccionó un template activo específico, derivamos tipo_vivienda de ese template
      let derivedTipo = form.tipo_vivienda || ''
      if (form.selected_template_id) {
        const tpl = templates.find(t => t.id === Number(form.selected_template_id))
        if (tpl) derivedTipo = tpl.tipo_vivienda || ''
      }
      const formData = {
        ...form,
        tipo_vivienda: derivedTipo || null,
        metros_cuadrados: form.metros_cuadrados ? parseInt(form.metros_cuadrados) : null,
        numero_habitaciones: form.numero_habitaciones ? parseInt(form.numero_habitaciones) : null,
        numero_banos: form.numero_banos ? parseInt(form.numero_banos) : null,
        proyecto_id: form.proyecto_id || null
      }

      if (modalType === 'crear') {
        await adminApi.crearVivienda(formData)
        setSuccess('Vivienda creada exitosamente')
      } else {
        await adminApi.actualizarVivienda(selectedVivienda.id_vivienda, formData)
        setSuccess('Vivienda actualizada exitosamente')
      }
      
      closeModal()
      await loadData()
    } catch (err) {
      setError(err.message || 'Error al procesar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async (e) => {
    e.preventDefault()

    if (!assignForm.beneficiario_uid) {
      setError('Debe seleccionar un beneficiario')
      return
    }

    setLoading(true)
    setError('')

    try {
      await adminApi.asignarVivienda(selectedForAssign.id_vivienda, assignForm.beneficiario_uid)
      // Cerramos el modal primero para evitar que coincida su desmontaje con el re-render de la lista
      closeAssignModal()
      // Permitimos que React procese el unmount del modal
      await new Promise(r => setTimeout(r, 0))
      await loadData()
      setSuccess('Vivienda asignada exitosamente')
    } catch (err) {
      setError(err.message || 'Error al asignar vivienda')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (vivienda) => {
    if (!window.confirm(`¿Está seguro de eliminar la vivienda en "${vivienda.direccion}"?`)) {
      return
    }

    setLoading(true)
    setError('')

    try {
      await adminApi.eliminarVivienda(vivienda.id_vivienda)
      setSuccess('Vivienda eliminada exitosamente')
      await loadData()
    } catch (err) {
      setError(err.message || 'Error al eliminar la vivienda')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'No definida'
    return new Date(dateString).toLocaleDateString('es-CL')
  }

  const getStatusColor = (status) => {
    const colors = {
      planificada: 'bg-gray-100 text-gray-800',
      en_construccion: 'bg-amber-100 text-amber-800',
      construida: 'bg-blue-100 text-blue-800',
      lista_para_entregar: 'bg-indigo-100 text-indigo-800',
      asignada: 'bg-violet-100 text-violet-800',
      entregada_inicial: 'bg-green-100 text-green-800',
      entregada_definitiva: 'bg-emerald-100 text-emerald-800',
      // Legacy/otros
      entregada: 'bg-green-100 text-green-800',
      terminada: 'bg-blue-100 text-blue-800',
      en_mantenimiento: 'bg-orange-100 text-orange-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status) => {
    const texts = {
      planificada: 'Planificada',
      en_construccion: 'En Construcción',
      construida: 'Construida',
      lista_para_entregar: 'Lista para Entregar',
      asignada: 'Asignada',
      entregada_inicial: 'Entregada (inicial)',
      entregada_definitiva: 'Entregada (definitiva)',
      // Legacy/otros
      entregada: 'Entregada',
      terminada: 'Terminada',
      en_mantenimiento: 'En Mantenimiento'
    }
    return texts[status] || status
  }

  if (loading && viviendas.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando viviendas...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // ----- Filtros -----
  const filteredViviendas = viviendas.filter(v => {
    const okProyecto = filterProyecto === 'all' || String(v.proyecto_id || '') === String(filterProyecto)
    const okEstado = filterEstado === 'all' || v.estado === filterEstado
    return okProyecto && okEstado
  })

  // ----- Agrupación por proyecto (posterior a filtros) -----
  const proyectosMap = proyectos.reduce((acc, p) => { acc[p.id] = p; return acc }, {})
  const grouped = {}
  filteredViviendas.forEach(v => {
    const key = v.proyecto_id || 'SIN_PROY'
    if (!grouped[key]) {
      const proj = proyectosMap[v.proyecto_id]
      grouped[key] = {
        projectId: v.proyecto_id || null,
        nombre: proj?.nombre || 'Sin Proyecto',
        tecnicos: proj?.tecnicos || [],
        viviendas: []
      }
    }
    grouped[key].viviendas.push(v)
  })
  const gruposOrdenados = Object.values(grouped).sort((a,b) => a.nombre.localeCompare(b.nombre, 'es'))

  return (
    <DashboardLayout>
      <div className="space-y-6">
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Gestión de Viviendas</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">Administrar viviendas y asignar a beneficiarios</p>
            </div>
            <div className="flex gap-2 items-center">
              <button 
                onClick={() => navigate('/home')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Volver
              </button>
              <button 
                onClick={() => openModal('crear')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Nueva Vivienda
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <SectionPanel title="Viviendas por Proyecto" description="Agrupadas y filtrables">
          {/* Controles de filtro */}
          <div className="mb-5 flex flex-col lg:flex-row gap-4 lg:items-end">
            <div className="flex flex-col gap-1 w-full lg:w-1/4">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Proyecto</label>
              <select value={filterProyecto} onChange={e=>setFilterProyecto(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700">
                <option value="all">Todos</option>
                {proyectos.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
                {viviendas.some(v=>!v.proyecto_id) && <option value="">(Sin Proyecto)</option>}
              </select>
            </div>
            <div className="flex flex-col gap-1 w-full lg:w-1/4">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Estado</label>
              <select value={filterEstado} onChange={e=>setFilterEstado(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700">
                <option value="all">Todos</option>
                <option value="planificada">Planificada</option>
                <option value="en_construccion">En Construcción</option>
                <option value="construida">Construida</option>
                <option value="lista_para_entregar">Lista para Entregar</option>
                <option value="asignada">Asignada</option>
                <option value="entregada_inicial">Entregada (inicial)</option>
                <option value="entregada_definitiva">Entregada (definitiva)</option>
                {/* Legacy */}
                <option value="entregada">Entregada (legacy)</option>
              </select>
            </div>
            <div className="flex gap-2 ml-auto">
              <button type="button" onClick={()=>{ setFilterProyecto('all'); setFilterEstado('all'); }} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">Reset</button>
              <button type="button" onClick={()=>{
                // Expandir / Colapsar todos
                const anyOpen = Object.values(collapsed).some(v => v === false)
                if (anyOpen) {
                  // Colapsar todos
                  const next = {}
                  gruposOrdenados.forEach(g => { next[g.projectId || 'SIN_PROY'] = true })
                  setCollapsed(next)
                } else {
                  setCollapsed({})
                }
              }} className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                {Object.keys(collapsed).length ? 'Expandir Todos' : 'Colapsar Todos'}
              </button>
            </div>
          </div>
          {viviendas.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No hay viviendas registradas</p>
              <button 
                onClick={() => openModal('crear')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crear Primera Vivienda
              </button>
            </div>
          )}
          <div className="space-y-8">
            {gruposOrdenados.map(grupo => {
              const key = grupo.projectId || 'SIN_PROY'
              const entregadas = grupo.viviendas.filter(v => ['entregada','entregada_inicial','entregada_definitiva'].includes((v.estado||'').toLowerCase())).length
              const total = grupo.viviendas.length
              const pct = total ? (entregadas / total) * 100 : 0
              const isCollapsed = collapsed[key]
              return (
                <div key={key} className="border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden">
                  <button type="button" onClick={()=>setCollapsed(c => ({ ...c, [key]: !c[key] }))} className="w-full text-left px-5 py-4 bg-gray-50 dark:bg-gray-800/60 flex flex-col gap-3 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                          <span className={`inline-block transform transition-transform ${isCollapsed ? 'rotate-90' : ''}`}>›</span>
                          {grupo.nombre}
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white">{total} viv</span>
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">{grupo.projectId ? `ID Proyecto: ${grupo.projectId}` : 'Sin proyecto asignado'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {grupo.tecnicos.length ? grupo.tecnicos.map(t => (
                          <span key={t.uid} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                            {t.nombre}
                          </span>
                        )) : (
                          <span className="text-xs text-gray-500 italic">Sin técnicos asignados</span>
                        )}
                      </div>
                    </div>
                    <div className="w-full">
                      <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                        <span>Entregadas {entregadas}/{total}</span>
                        <span>{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div className={`h-full ${pct < 40 ? 'bg-red-500' : pct < 70 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </button>
                  {!isCollapsed && (
                    <div className="p-5 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                      {grupo.viviendas.map(vivienda => (
                        <div key={vivienda.id_vivienda} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">{vivienda.direccion}
                                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${getStatusColor(vivienda.estado)}`}>{getStatusText(vivienda.estado)}</span>
                              </h4>
                              <p className="text-[11px] text-gray-500 mt-1">Tipo: {vivienda.tipo_vivienda || '—'} · Metros: {vivienda.metros_cuadrados || 'N/A'} · Hab: {vivienda.numero_habitaciones || 'N/A'}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                              <button onClick={() => openAssignModal(vivienda)} className="px-2 py-1 text-[11px] bg-green-600 text-white rounded hover:bg-green-700">{vivienda.beneficiario_uid ? 'Reasignar' : 'Asignar'}</button>
                              <button onClick={() => openModal('editar', vivienda)} className="px-2 py-1 text-[11px] border border-gray-300 text-gray-700 rounded hover:bg-gray-50">Editar</button>
                              <button onClick={() => handleDelete(vivienda)} className="px-2 py-1 text-[11px] border border-red-300 text-red-700 rounded hover:bg-red-50">Eliminar</button>
                            </div>
                          </div>
                          <div className="text-[12px] text-gray-600 dark:text-gray-400 space-y-1">
                            <div><span className="font-medium">Beneficiario:</span> {vivienda.beneficiario_nombre ? `${vivienda.beneficiario_nombre} (${vivienda.beneficiario_email})` : 'Sin asignar'}</div>
                            <div><span className="font-medium">Entrega:</span> {formatDate(vivienda.fecha_entrega)}</div>
                            {vivienda.observaciones && <div className="line-clamp-2"><span className="font-medium">Obs:</span> {vivienda.observaciones}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </SectionPanel>

        {/* Modal de Crear/Editar Vivienda */}
        <Modal isOpen={showModal} onClose={closeModal}>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {modalType === 'crear' ? 'Crear Nueva Vivienda' : 'Editar Vivienda'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      name="direccion"
                      value={form.direccion}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 placeholder-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400"
                      placeholder="Ej: Calle 123, Sector X"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proyecto
                    </label>
                    <select
                      name="proyecto_id"
                      value={form.proyecto_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option value="">Seleccionar proyecto...</option>
                      {proyectos.map((proyecto) => (
                        <option key={proyecto.id} value={proyecto.id}>
                          {proyecto.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template de posventa activo
                    </label>
                    <select
                      name="selected_template_id"
                      value={form.selected_template_id || ''}
                      onChange={(e)=>{
                        const id = e.target.value ? Number(e.target.value) : ''
                        const tpl = templates.find(t=>t.id===id)
                        setForm(prev=>({
                          ...prev,
                          selected_template_id: id,
                          // Derivamos tipo_vivienda del template seleccionado
                          tipo_vivienda: tpl ? (tpl.tipo_vivienda || '') : ''
                        }))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option value="">(General activo)</option>
                      {templates.filter(t=>t.activo).map(t => (
                        <option key={t.id} value={t.id}>
                          {t.nombre} — {t.tipo_vivienda || 'General'} (v{t.version})
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Tipo de vivienda: {form.tipo_vivienda || 'General'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Metros Cuadrados</label>
                    <input type="number" name="metros_cuadrados" value={form.metros_cuadrados} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100" min="1" placeholder="Ej: 36" />
                  </div>

                  {modalType !== 'crear' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número de Habitaciones</label>
                      <input type="number" name="numero_habitaciones" value={form.numero_habitaciones} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100" min="1" placeholder="Ej: 2" />
                    </div>
                  )}

                  {modalType !== 'crear' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número de Baños</label>
                      <input type="number" name="numero_banos" value={form.numero_banos} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100" min="1" placeholder="Ej: 1" />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      name="estado"
                      value={form.estado}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option value="planificada">Planificada</option>
                      <option value="en_construccion">En Construcción</option>
                      <option value="construida">Construida</option>
                      <option value="lista_para_entregar">Lista para Entregar</option>
                      <option value="asignada">Asignada</option>
                      <option value="entregada_inicial">Entregada (inicial)</option>
                      <option value="entregada_definitiva">Entregada (definitiva)</option>
                      {/* No mostramos 'entregada' legacy para nuevas ediciones/creaciones */}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Entrega
                    </label>
                    <input
                      type="date"
                      name="fecha_entrega"
                      value={form.fecha_entrega}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {modalType !== 'crear' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                      <textarea name="observaciones" value={form.observaciones} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-800 placeholder-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400" placeholder="Notas adicionales sobre la vivienda" />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
                  >
                    {loading ? 'Procesando...' : modalType === 'crear' ? 'Crear Vivienda' : 'Actualizar Vivienda'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 min-w-[110px]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => { closeModal(); navigate('/home'); }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 min-w-[140px]"
                  >
                    Volver al Inicio
                  </button>
                </div>
              </form>
            </div>
        </Modal>

        {/* Modal de Asignación */}
        <Modal isOpen={showAssignModal} onClose={closeAssignModal} maxWidth="max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Asignar Vivienda
              </h3>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Vivienda:</span> {selectedForAssign?.direccion}
                </p>
              </div>

              <form onSubmit={handleAssign} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beneficiario
                  </label>
                  <select
                    name="beneficiario_uid"
                    value={assignForm.beneficiario_uid}
                    onChange={handleAssignInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar beneficiario...</option>
                    {beneficiarios.map((beneficiario) => (
                      <option key={beneficiario.uid} value={beneficiario.uid}>
                        {beneficiario.nombre} ({beneficiario.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
                  >
                    {loading ? 'Asignando...' : 'Asignar Vivienda'}
                  </button>
                  <button
                    type="button"
                    onClick={closeAssignModal}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 min-w-[110px]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => { closeAssignModal(); navigate('/home'); }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 min-w-[140px]"
                  >
                    Volver al Inicio
                  </button>
                </div>
              </form>
            </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}