import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../../components/ui/DashboardLayout'
import { SectionPanel } from '../../components/ui/SectionPanel'

export default function GestionHabitacionesTemplate() {
  const { templateId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [template, setTemplate] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('habitacion') // 'habitacion', 'formitem'
  const [selectedHabitacion, setSelectedHabitacion] = useState(null)
  const [habitacionForm, setHabitacionForm] = useState({
    nombre_habitacion: '',
    metros_cuadrados: '',
    tipo_habitacion: 'dormitorio',
    orden: 1
  })

  const tiposHabitacion = [
    'dormitorio',
    'cocina',
    'bano',
    'living',
    'comedor',
    'lavadero',
    'bodega',
    'terraza',
    'otro'
  ]

  useEffect(() => {
    async function loadTemplateData() {
      setLoading(true)
      setError('')
      
      try {
        const response = await fetch(`/api/admin/templates/${templateId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        const data = await response.json()
        
        if (data.success) {
          setTemplate(data.data)
        } else {
          setError(data.message || 'Error cargando template')
        }
      } catch (err) {
        setError('Error de conexión al cargar template')
      } finally {
        setLoading(false)
      }
    }
    
    loadTemplateData()
  }, [templateId])

  async function loadTemplate() {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setTemplate(data.data)
      } else {
        setError(data.message || 'Error cargando template')
      }
    } catch (err) {
      setError('Error de conexión al cargar template')
    } finally {
      setLoading(false)
    }
  }

  const handleHabitacionInputChange = (e) => {
    const { name, value } = e.target
    setHabitacionForm(prev => ({ ...prev, [name]: value }))
  }

  const resetHabitacionForm = () => {
    setHabitacionForm({
      nombre_habitacion: '',
      metros_cuadrados: '',
      tipo_habitacion: 'dormitorio',
      orden: 1
    })
  }

  const openHabitacionModal = (habitacion = null) => {
    setModalType('habitacion')
    setSelectedHabitacion(habitacion)
    
    if (habitacion) {
      setHabitacionForm({
        nombre_habitacion: habitacion.nombre_habitacion || '',
        metros_cuadrados: habitacion.metros_cuadrados || '',
        tipo_habitacion: habitacion.tipo_habitacion || 'dormitorio',
        orden: habitacion.orden || 1
      })
    } else {
      resetHabitacionForm()
    }
    
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedHabitacion(null)
    resetHabitacionForm()
  }

  const handleHabitacionSubmit = async (e) => {
    e.preventDefault()
    
    if (!habitacionForm.nombre_habitacion.trim()) {
      setError('El nombre de la habitación es obligatorio')
      return
    }

    setLoading(true)
    setError('')

    try {
      const formData = {
        nombre_habitacion: habitacionForm.nombre_habitacion.trim(),
        metros_cuadrados: parseFloat(habitacionForm.metros_cuadrados),
        tipo_habitacion: habitacionForm.tipo_habitacion,
        orden: parseInt(habitacionForm.orden)
      }

      const url = selectedHabitacion 
        ? `/api/admin/templates/habitaciones/${selectedHabitacion.id}`
        : `/api/admin/templates/${templateId}/habitaciones`
      
      const method = selectedHabitacion ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(selectedHabitacion ? 'Habitación actualizada exitosamente' : 'Habitación agregada exitosamente')
        closeModal()
        await loadTemplate()
      } else {
        setError(data.message || 'Error al procesar la solicitud')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteHabitacion = async (habitacion) => {
    if (!window.confirm(`¿Está seguro de eliminar la habitación "${habitacion.nombre_habitacion}"?`)) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/templates/habitaciones/${habitacion.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Habitación eliminada exitosamente')
        await loadTemplate()
      } else {
        setError(data.message || 'Error al eliminar habitación')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !template) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando template...</p>
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
                Habitaciones: {template?.nombre}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">
                {template?.descripcion || 'Gestionar habitaciones y formularios del template'}
              </p>
              <div className="flex gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{template?.metros_totales}m² totales</span>
                <span>{template?.numero_habitaciones} habitaciones</span>
                <span>{template?.numero_banos} baños</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => navigate('/admin/templates')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Volver a Templates
              </button>
              <button 
                onClick={() => openHabitacionModal()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Agregar Habitación
              </button>
            </div>
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

        {/* Lista de Habitaciones */}
        <SectionPanel title="Habitaciones del Template" description="Espacios que componen este tipo de casa">
          {!template?.habitaciones || template.habitaciones.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No hay habitaciones configuradas</p>
              <button 
                onClick={() => openHabitacionModal()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Agregar Primera Habitación
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {template.habitaciones
                .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                .map(habitacion => (
                <div key={habitacion.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {habitacion.nombre_habitacion}
                        </h3>
                        <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                          {habitacion.tipo_habitacion}
                        </span>
                        <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                          {habitacion.metros_cuadrados}m²
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Items de formulario configurados: {habitacion.form_items?.length || 0}
                      </p>
                      
                      {habitacion.form_items && habitacion.form_items.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-3">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Items del formulario:</p>
                          <div className="flex flex-wrap gap-1">
                            {habitacion.form_items.map(item => (
                              <span key={item.id} className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
                                {item.nombre_item} ({item.tipo_input})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => openHabitacionModal(habitacion)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => navigate(`/admin/templates/habitaciones/${habitacion.id}/formularios`)}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Formularios
                      </button>
                      <button
                        onClick={() => handleDeleteHabitacion(habitacion)}
                        className="px-3 py-1 text-xs border border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
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

        {/* Modal de Habitación */}
        {showModal && modalType === 'habitacion' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedHabitacion ? 'Editar Habitación' : 'Agregar Habitación'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleHabitacionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre de la Habitación *
                  </label>
                  <input
                    type="text"
                    name="nombre_habitacion"
                    value={habitacionForm.nombre_habitacion}
                    onChange={handleHabitacionInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300"
                    placeholder="Ej: Dormitorio Principal"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Metros Cuadrados *
                    </label>
                    <input
                      type="number"
                      name="metros_cuadrados"
                      value={habitacionForm.metros_cuadrados}
                      onChange={handleHabitacionInputChange}
                      step="0.1"
                      min="0.1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Orden
                    </label>
                    <input
                      type="number"
                      name="orden"
                      value={habitacionForm.orden}
                      onChange={handleHabitacionInputChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Habitación *
                  </label>
                  <select
                    name="tipo_habitacion"
                    value={habitacionForm.tipo_habitacion}
                    onChange={handleHabitacionInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300"
                    required
                  >
                    {tiposHabitacion.map(tipo => (
                      <option key={tipo} value={tipo}>
                        {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Procesando...' : selectedHabitacion ? 'Actualizar' : 'Agregar'}
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