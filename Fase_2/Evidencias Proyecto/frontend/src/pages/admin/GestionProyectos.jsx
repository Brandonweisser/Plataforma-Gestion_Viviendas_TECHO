import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '../../components/ui/DashboardLayout'
import { SectionPanel } from '../../components/ui/SectionPanel'
import { adminApi } from '../../services/api'
import { geoSearch, geoValidate } from '../../services/GeocodingService'

export default function GestionProyectos() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [proyectos, setProyectos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('crear')
  const [selectedProject, setSelectedProject] = useState(null)
  
  // Estados para validación de direcciones
  const [geoState, setGeoState] = useState({ status: 'idle', msg: '', suggestions: [] })
  const [addressLocked, setAddressLocked] = useState(false)
  
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    ubicacion: '',
    ubicacion_normalizada: '',
    latitud: '',
    longitud: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'activo',
    coordinador_uid: ''
  })

  // Test inicial del servicio de geocodificación (debug)
  useEffect(() => {
    console.log('Servicios de geocodificación cargados:', { geoSearchPresent: !!geoSearch, geoValidatePresent: !!geoValidate })
  }, [])

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
    if (name === 'ubicacion' && addressLocked) {
      setAddressLocked(false)
      setGeoState({ status: 'idle', msg: '', suggestions: [] })
      setForm(prev => ({ ...prev, ubicacion_normalizada: '', latitud: '', longitud: '' }))
    }
  }

  const resetForm = () => {
    setForm({
      nombre: '',
      descripcion: '',
      ubicacion: '',
      ubicacion_normalizada: '',
      latitud: '',
      longitud: '',
      fecha_inicio: '',
      fecha_fin: '',
      estado: 'activo',
      coordinador_uid: ''
    })
    setGeoState({ status: 'idle', msg: '', suggestions: [] })
    setAddressLocked(false)
  }

  const openModal = (type, project = null) => {
    setModalType(type)
    setSelectedProject(project)
    
    if (type === 'editar' && project) {
      setForm({
        nombre: project.nombre || '',
        descripcion: project.descripcion || '',
        ubicacion: project.ubicacion || '',
        ubicacion_normalizada: project.ubicacion_normalizada || '',
        latitud: project.latitud || '',
        longitud: project.longitud || '',
        fecha_inicio: project.fecha_inicio ? (project.fecha_inicio.split ? project.fecha_inicio.split('T')[0] : project.fecha_inicio) : '',
        fecha_fin: project.fecha_entrega || project.fecha_fin || '',
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

          {
            id: 'test2', 
      
      setForm(prev => ({
        ...prev,
        ubicacion: selectedAddress.place_name,
        ubicacion_normalizada: validation.normalized,
        latitud: validation.lat.toString(),
        longitud: validation.lng.toString()
      }))
      
      setGeoState({ status: 'ok', msg: 'Dirección validada correctamente', suggestions: [] })
      setAddressLocked(true)
    } catch (error) {
      console.error('Error validando dirección:', error)
      setGeoState({ status: 'error', msg: error.message || 'Error validando dirección', suggestions: [] })
    }
  }

  // useEffect para autocompletado con debounce
  useEffect(() => {
    console.log('useEffect autocompletado ejecutado:', { 
      ubicacion: form.ubicacion, 
      addressLocked,
      length: form.ubicacion?.length 
    })
    
    if (addressLocked) {
      console.log('Dirección bloqueada, limpiando sugerencias')
      setGeoState(prev => ({ ...prev, suggestions: [] }))
      return
    }

    const timeoutId = setTimeout(async () => {
      const query = form.ubicacion?.trim()
      console.log('Procesando búsqueda para:', query)
      
      if (!query || query.length < 3) {
        console.log('Query muy corta o vacía, limpiando sugerencias')
        setGeoState(prev => ({ ...prev, suggestions: [] }))
        return
      }

      try {
        console.log('Buscando direcciones para:', query)
        const suggestions = await searchAddresses(query)
        console.log('Sugerencias encontradas:', suggestions)
        setGeoState(prev => ({ ...prev, suggestions }))
      } catch (error) {
        console.error('Error en búsqueda de direcciones:', error)
        setGeoState(prev => ({ ...prev, suggestions: [] }))
      }
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [form.ubicacion, addressLocked])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!form.nombre.trim()) {
      setError('El nombre del proyecto es obligatorio')
      return
    }

<<<<<<< Updated upstream
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
=======
    if (!form.ubicacion.trim()) {
      setError('La ubicación del proyecto es obligatoria')
>>>>>>> Stashed changes
      return
    }

    setLoading(true)
    setError('')

    try {
      // Preparar datos - convertir strings vacíos de coordenadas a null
      const projectData = {
        ...form,
        latitud: form.latitud && form.latitud.toString().trim() ? parseFloat(form.latitud) : null,
        longitud: form.longitud && form.longitud.toString().trim() ? parseFloat(form.longitud) : null
      }

      if (modalType === 'crear') {
        await adminApi.crearProyecto(projectData)
        setSuccess('Proyecto creado exitosamente')
      } else {
        await adminApi.actualizarProyecto(selectedProject.id_proyecto, projectData)
        setSuccess('Proyecto actualizado exitosamente')
      }
      
      closeModal()
      await loadData()
    } catch (err) {
      console.error('Error al crear/actualizar proyecto:', err);
      setError(err.message || 'Error al procesar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (projectId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
      return
    }

    try {
      await adminApi.eliminarProyecto(projectId)
      setSuccess('Proyecto eliminado exitosamente')
      await loadData()
    } catch (err) {
      setError(err.message || 'Error eliminando proyecto')
    }
  }

  if (loading && proyectos.length === 0) {
    return (
      <DashboardLayout title="Gestión de Proyectos">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Gestión de Proyectos">
      <div className="space-y-6">
        {/* Header */}
        <SectionPanel>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Gestión de Proyectos</h2>
              <p className="text-gray-600">Administrar proyectos de vivienda y asignar técnicos</p>
            </div>
            <button
              onClick={() => openModal('crear')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Nuevo Proyecto
            </button>
          </div>
        </SectionPanel>

        {/* Mensajes de estado */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Lista de Proyectos */}
        <SectionPanel>
          <h3 className="text-lg font-medium text-gray-900 mb-4">LISTA DE PROYECTOS</h3>
          
          {proyectos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🏗️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay proyectos</h3>
              <p className="text-gray-600 mb-6">Comienza creando tu primer proyecto de vivienda</p>
              <button
                onClick={() => openModal('crear')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crear Primer Proyecto
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {proyectos.map((proyecto) => (
                <div key={proyecto.id_proyecto} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900">{proyecto.nombre}</h4>
                      <div className="mt-1 text-sm text-gray-600">
                        <p><span className="font-medium">Ubicación:</span> {proyecto.ubicacion}</p>
                        <div className="flex gap-4 mt-1">
                          <span><span className="font-medium">Inicio:</span> {proyecto.fecha_inicio ? new Date(proyecto.fecha_inicio).toLocaleDateString() : 'No definida'}</span>
                          <span><span className="font-medium">Fin:</span> {proyecto.fecha_entrega ? new Date(proyecto.fecha_entrega).toLocaleDateString() : 'No definida'}</span>
                        </div>
                        {(proyecto.latitud && proyecto.longitud) && (
                          <p><span className="font-medium">Coordenadas:</span> {proyecto.latitud}, {proyecto.longitud}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => openModal('editar', proyecto)}
                        className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(proyecto.id_proyecto)}
                        className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionPanel>

        {/* Modal para crear/editar proyecto */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
              <button
                type="button"
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
                aria-label="Cerrar modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h3 className="text-lg font-semibold mb-4 pr-8">
                {modalType === 'crear' ? 'Crear Nuevo Proyecto' : 'Editar Proyecto'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre del Proyecto *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Descripción del proyecto (opcional)"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ubicación *
                  </label>
                  <input
                    type="text"
                    name="ubicacion"
                    value={form.ubicacion}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Ej: Comuna, Región, Chile"
                    required
                  />
                  {geoState.suggestions.length > 0 && !addressLocked && (
                    <div className="absolute z-[1200] mt-1 w-full bg-white text-gray-800 border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-auto">
                      {geoState.suggestions.map((suggestion, index) => (
                        <button
                          key={suggestion.id || index}
                          type="button"
                          onClick={() => validateAddress(suggestion)}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                        >
                          {suggestion.place_name}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-1 text-xs">
                    {geoState.status === 'loading' && <span className="text-blue-600">{geoState.msg}</span>}
                    {geoState.status === 'ok' && (
                      <span className="text-green-600">
                        {geoState.msg}
                        {form.ubicacion_normalizada && (
                          <span className="ml-2 font-medium">· {form.ubicacion_normalizada}</span>
                        )}
                      </span>
                    )}
                    {geoState.status === 'error' && <span className="text-red-600">{geoState.msg}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coordinador</label>
                    <select
                      name="coordinador_uid"
                      value={form.coordinador_uid}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">-- Sin asignar --</option>
                      {usuarios
                        .filter(u => ['administrador','admin'].includes(u.rol) || u.rol === 'tecnico')
                        .map(u => (
                          <option key={u.uid} value={u.uid}>{u.nombre} ({u.rol})</option>
                        ))}
                    </select>
                  </div>

                  {(form.latitud || form.longitud || form.ubicacion_normalizada) && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-xs space-y-1">
                      {form.ubicacion_normalizada && (
                        <div><span className="font-medium">Normalizada:</span> {form.ubicacion_normalizada}</div>
                      )}
                      {form.latitud && form.longitud && (
                        <div><span className="font-medium">Coords:</span> {form.latitud}, {form.longitud}</div>
                      )}
                    </div>
                  )}

                  {!addressLocked && form.ubicacion && form.ubicacion.length >= 3 && geoState.suggestions.length === 0 && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setGeoState({ status: 'loading', msg: 'Validando...', suggestions: [] })
                            const validation = await geoValidate({ address: form.ubicacion })
                            setForm(prev => ({
                              ...prev,
                              ubicacion_normalizada: validation.normalized,
                              latitud: validation.lat.toString(),
                              longitud: validation.lng.toString()
                            }))
                            setGeoState({ status: 'ok', msg: 'Dirección validada', suggestions: [] })
                            setAddressLocked(true)
                          } catch (error) {
                            setGeoState({ status: 'error', msg: error.message || 'No se pudo validar', suggestions: [] })
                          }
                        }}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                      >
                        Validar dirección manualmente
                      </button>
                    </div>
                  )}
                </div> {/* cierre .relative */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Inicio</label>
                    <input
                      type="date"
                      name="fecha_inicio"
                      value={form.fecha_inicio}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha de Fin
                    </label>
                    <input
                      type="date"
                      name="fecha_fin"
                      value={form.fecha_fin}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Guardando...' : (modalType === 'crear' ? 'Crear' : 'Guardar cambios')}
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