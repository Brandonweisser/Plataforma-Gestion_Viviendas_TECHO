import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../../components/ui/DashboardLayout'
import { SectionPanel } from '../../components/ui/SectionPanel'
import { adminApi } from '../../services/api'

export default function GestionProyectos() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [proyectos, setProyectos] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('crear')
  const [selectedProject, setSelectedProject] = useState(null)
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    ubicacion: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'activo',
    coordinador_uid: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    
    try {
      const [proyectosRes, usuariosRes] = await Promise.allSettled([
        adminApi.listarProyectos(),
        adminApi.listarUsuarios()
      ])

      if (proyectosRes.status === 'fulfilled') {
        setProyectos(proyectosRes.value.data || [])
      }

      if (usuariosRes.status === 'fulfilled') {
        const allUsers = usuariosRes.value.data || []
        setUsuarios(allUsers)
        setTecnicos(allUsers.filter(u => u.rol === 'tecnico'))
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

  const resetForm = () => {
    setForm({
      nombre: '',
      descripcion: '',
      ubicacion: '',
      fecha_inicio: '',
      fecha_fin: '',
      estado: 'activo',
      coordinador_uid: ''
    })
  }

  const openModal = (type, project = null) => {
    setModalType(type)
    setSelectedProject(project)
    
    if (type === 'editar' && project) {
      setForm({
        nombre: project.nombre || '',
        descripcion: project.descripcion || '',
        ubicacion: project.ubicacion || '',
        fecha_inicio: project.fecha_inicio ? project.fecha_inicio.split('T')[0] : '',
        fecha_fin: project.fecha_fin ? project.fecha_fin.split('T')[0] : '',
        estado: project.estado || 'activo',
        coordinador_uid: project.coordinador_uid || ''
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
    setSelectedProject(null)
    resetForm()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!form.nombre.trim()) {
      setError('El nombre del proyecto es obligatorio')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (modalType === 'crear') {
        await adminApi.crearProyecto(form)
        setSuccess('Proyecto creado exitosamente')
      } else {
        await adminApi.actualizarProyecto(selectedProject.id, form)
        setSuccess('Proyecto actualizado exitosamente')
      }
      
      closeModal()
      await loadData()
    } catch (err) {
      setError(err.message || 'Error al procesar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (project) => {
    if (!window.confirm(`¿Está seguro de eliminar el proyecto "${project.nombre}"?`)) {
      return
    }

    setLoading(true)
    setError('')

    try {
      await adminApi.eliminarProyecto(project.id)
      setSuccess('Proyecto eliminado exitosamente')
      await loadData()
    } catch (err) {
      setError(err.message || 'Error al eliminar el proyecto')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignTechnician = async (projectId, technicianId) => {
    setLoading(true)
    setError('')

    try {
      await adminApi.asignarTecnicoProyecto(projectId, technicianId)
      setSuccess('Técnico asignado exitosamente')
      await loadData()
    } catch (err) {
      setError(err.message || 'Error al asignar técnico')
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
      'activo': 'bg-green-100 text-green-800',
      'pausado': 'bg-yellow-100 text-yellow-800',
      'completado': 'bg-blue-100 text-blue-800',
      'cancelado': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading && proyectos.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando proyectos...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Gestión de Proyectos</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">Administrar proyectos de vivienda y asignar técnicos</p>
            </div>
            <button 
              onClick={() => openModal('crear')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Nuevo Proyecto
            </button>
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

        <SectionPanel title="Lista de Proyectos">
          <div className="grid gap-6">
            {proyectos.length > 0 ? (
              proyectos.map((proyecto) => (
                <div key={proyecto.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-sm transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{proyecto.nombre}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(proyecto.estado)}`}>
                          {proyecto.estado}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">{proyecto.descripcion}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Ubicación:</span> {proyecto.ubicacion || 'No especificada'}
                        </div>
                        <div>
                          <span className="font-medium">Inicio:</span> {formatDate(proyecto.fecha_inicio)}
                        </div>
                        <div>
                          <span className="font-medium">Fin:</span> {formatDate(proyecto.fecha_fin)}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => openModal('editar', proyecto)}
                        className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(proyecto)}
                        className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Técnicos Asignados</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {proyecto.tecnicos && proyecto.tecnicos.length > 0 ? (
                        proyecto.tecnicos.map((tecnico) => (
                          <span key={tecnico.uid} className="inline-flex items-center px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                            {tecnico.nombre}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">Sin técnicos asignados</span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <select 
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignTechnician(proyecto.id, e.target.value)
                            e.target.value = ''
                          }
                        }}
                        className="px-3 py-1 text-sm border border-gray-300 rounded"
                        disabled={loading}
                      >
                        <option value="">Asignar técnico...</option>
                        {tecnicos.map((tecnico) => (
                          <option key={tecnico.uid} value={tecnico.uid}>
                            {tecnico.nombre} ({tecnico.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No hay proyectos registrados</p>
                <button 
                  onClick={() => openModal('crear')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear Primer Proyecto
                </button>
              </div>
            )}
          </div>
        </SectionPanel>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {modalType === 'crear' ? 'Crear Nuevo Proyecto' : 'Editar Proyecto'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Proyecto
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    name="ubicacion"
                    value={form.ubicacion}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      name="fecha_inicio"
                      value={form.fecha_inicio}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      name="fecha_fin"
                      value={form.fecha_fin}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    name="estado"
                    value={form.estado}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="activo">Activo</option>
                    <option value="pausado">Pausado</option>
                    <option value="completado">Completado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coordinador
                  </label>
                  <select
                    name="coordinador_uid"
                    value={form.coordinador_uid}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar coordinador...</option>
                    {usuarios.filter(u => u.rol === 'administrador' || u.rol === 'tecnico').map((user) => (
                      <option key={user.uid} value={user.uid}>
                        {user.nombre} ({user.rol})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
                  >
                    {loading ? 'Procesando...' : modalType === 'crear' ? 'Crear Proyecto' : 'Actualizar Proyecto'}
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
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}