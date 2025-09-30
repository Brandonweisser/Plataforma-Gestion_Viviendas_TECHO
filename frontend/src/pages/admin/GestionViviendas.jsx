import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../../components/ui/DashboardLayout'
import { SectionPanel } from '../../components/ui/SectionPanel'
import { adminApi } from '../../services/api'

export default function GestionViviendas() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [viviendas, setViviendas] = useState([])
  const [proyectos, setProyectos] = useState([])
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
    tipo_vivienda: 'casa',
    metros_cuadrados: '',
    numero_habitaciones: '',
    numero_banos: '',
    estado: 'en_construccion',
    fecha_entrega: '',
    observaciones: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    
    try {
      const [viviendasRes, proyectosRes, usuariosRes] = await Promise.allSettled([
        adminApi.listarViviendas(),
        adminApi.listarProyectos(),
        adminApi.listarUsuarios()
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
      tipo_vivienda: 'casa',
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
        tipo_vivienda: vivienda.tipo_vivienda || 'casa',
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

    setLoading(true)
    setError('')

    try {
      const formData = {
        ...form,
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
      setSuccess('Vivienda asignada exitosamente')
      closeAssignModal()
      await loadData()
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
      'en_construccion': 'bg-yellow-100 text-yellow-800',
      'terminada': 'bg-blue-100 text-blue-800',
      'entregada': 'bg-green-100 text-green-800',
      'en_mantenimiento': 'bg-orange-100 text-orange-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status) => {
    const texts = {
      'en_construccion': 'En Construcción',
      'terminada': 'Terminada',
      'entregada': 'Entregada',
      'en_mantenimiento': 'En Mantenimiento'
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Gestión de Viviendas</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">Administrar viviendas y asignar a beneficiarios</p>
            </div>
            <button 
              onClick={() => openModal('crear')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Nueva Vivienda
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

        <SectionPanel title="Lista de Viviendas">
          <div className="grid gap-6">
            {viviendas.length > 0 ? (
              viviendas.map((vivienda) => (
                <div key={vivienda.id_vivienda} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-sm transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{vivienda.direccion}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vivienda.estado)}`}>
                          {getStatusText(vivienda.estado)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Proyecto:</span> {vivienda.proyecto_nombre || 'Sin proyecto'}
                        </div>
                        <div>
                          <span className="font-medium">Tipo:</span> {vivienda.tipo_vivienda || 'No especificado'}
                        </div>
                        <div>
                          <span className="font-medium">Metros:</span> {vivienda.metros_cuadrados || 'N/A'} m²
                        </div>
                        <div>
                          <span className="font-medium">Habitaciones:</span> {vivienda.numero_habitaciones || 'N/A'}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Beneficiario:</span> {
                            vivienda.beneficiario_nombre 
                              ? `${vivienda.beneficiario_nombre} (${vivienda.beneficiario_email})`
                              : 'Sin asignar'
                          }
                        </div>
                        <div>
                          <span className="font-medium">Fecha Entrega:</span> {formatDate(vivienda.fecha_entrega)}
                        </div>
                      </div>

                      {vivienda.observaciones && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Observaciones:</span> {vivienda.observaciones}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <button 
                        onClick={() => openAssignModal(vivienda)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        {vivienda.beneficiario_uid ? 'Reasignar' : 'Asignar'}
                      </button>
                      <button 
                        onClick={() => openModal('editar', vivienda)}
                        className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDelete(vivienda)}
                        className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
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
          </div>
        </SectionPanel>

        {/* Modal de Crear/Editar Vivienda */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      Tipo de Vivienda
                    </label>
                    <select
                      name="tipo_vivienda"
                      value={form.tipo_vivienda}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="casa">Casa</option>
                      <option value="departamento">Departamento</option>
                      <option value="duplex">Duplex</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metros Cuadrados
                    </label>
                    <input
                      type="number"
                      name="metros_cuadrados"
                      value={form.metros_cuadrados}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Habitaciones
                    </label>
                    <input
                      type="number"
                      name="numero_habitaciones"
                      value={form.numero_habitaciones}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Baños
                    </label>
                    <input
                      type="number"
                      name="numero_banos"
                      value={form.numero_banos}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                    />
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
                      <option value="en_construccion">En Construcción</option>
                      <option value="terminada">Terminada</option>
                      <option value="entregada">Entregada</option>
                      <option value="en_mantenimiento">En Mantenimiento</option>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      name="observaciones"
                      value={form.observaciones}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
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
          </div>
        )}

        {/* Modal de Asignación */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
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
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}