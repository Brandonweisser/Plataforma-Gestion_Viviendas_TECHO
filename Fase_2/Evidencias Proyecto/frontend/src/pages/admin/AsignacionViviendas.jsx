import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../../components/ui/DashboardLayout'
import { SectionPanel } from '../../components/ui/SectionPanel'
import { Modal } from '../../components/ui/Modal'
import { adminApi } from '../../services/api'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function AsignacionViviendas() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [viviendas, setViviendas] = useState([])
  const [beneficiarios, setBeneficiarios] = useState([])
  const [filtros, setFiltros] = useState({
    estado: 'todas',
    asignacion: 'todas',
    proyecto: 'todos'
  })
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedVivienda, setSelectedVivienda] = useState(null)
  const [assignForm, setAssignForm] = useState({ beneficiario_uid: '' })
  const [proyectos, setProyectos] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    
    try {
      const [viviendasRes, usuariosRes, proyectosRes] = await Promise.allSettled([
        adminApi.listarViviendas(),
        adminApi.listarUsuarios(),
        adminApi.listarProyectos()
      ])

      if (viviendasRes.status === 'fulfilled') {
        setViviendas(viviendasRes.value.data || [])
      }

      if (usuariosRes.status === 'fulfilled') {
        const allUsers = usuariosRes.value.data || []
        setBeneficiarios(allUsers.filter(u => u.rol === 'beneficiario'))
      }

      if (proyectosRes.status === 'fulfilled') {
        setProyectos(proyectosRes.value.data || [])
      }

    } catch (err) {
      setError(err.message || 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFiltros(prev => ({ ...prev, [name]: value }))
  }

  const handleAssignInputChange = (e) => {
    const { name, value } = e.target
    setAssignForm(prev => ({ ...prev, [name]: value }))
  }

  const openAssignModal = (vivienda) => {
    setSelectedVivienda(vivienda)
    setAssignForm({ beneficiario_uid: vivienda.beneficiario_uid || '' })
    setShowAssignModal(true)
    setError('')
    setSuccess('')
  }

  const closeAssignModal = () => {
    setShowAssignModal(false)
    setSelectedVivienda(null)
    setAssignForm({ beneficiario_uid: '' })
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
      await adminApi.asignarVivienda(selectedVivienda.id_vivienda, assignForm.beneficiario_uid)
      // Cerrar modal primero
      closeAssignModal()
      await new Promise(r => setTimeout(r, 0))
      await loadData()
      setSuccess('Vivienda asignada exitosamente')
    } catch (err) {
      setError(err.message || 'Error al asignar vivienda')
    } finally {
      setLoading(false)
    }
  }

  const handleUnassign = async (vivienda) => {
    if (!window.confirm(`¿Está seguro de desasignar la vivienda en "${vivienda.direccion}"?`)) {
      return
    }

    setLoading(true)
    setError('')

    try {
      await adminApi.desasignarVivienda(vivienda.id_vivienda)
      setSuccess('Vivienda desasignada exitosamente')
      await loadData()
    } catch (err) {
      setError(err.message || 'Error al desasignar vivienda')
    } finally {
      setLoading(false)
    }
  }

  const filteredViviendas = viviendas.filter(vivienda => {
    // Filtro por estado
    if (filtros.estado !== 'todas' && vivienda.estado !== filtros.estado) {
      return false
    }

    // Filtro por asignación
    if (filtros.asignacion === 'asignadas' && !vivienda.beneficiario_uid) {
      return false
    }
    if (filtros.asignacion === 'sin_asignar' && vivienda.beneficiario_uid) {
      return false
    }

    // Filtro por proyecto
    if (filtros.proyecto !== 'todos' && vivienda.proyecto_id !== parseInt(filtros.proyecto)) {
      return false
    }

    return true
  })

  const stats = {
    total: viviendas.length,
    asignadas: viviendas.filter(v => v.beneficiario_uid).length,
    sin_asignar: viviendas.filter(v => !v.beneficiario_uid).length,
    entregadas: viviendas.filter(v => v.estado === 'entregada').length
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
            <p className="text-gray-600">Cargando asignaciones...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Asignación de Viviendas</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">Gestionar asignaciones de viviendas a beneficiarios</p>
            </div>
            <button 
              onClick={() => navigate('/home')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Volver
            </button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-600">Total Viviendas</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.asignadas}</div>
              <div className="text-sm text-green-600">Asignadas</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.sin_asignar}</div>
              <div className="text-sm text-yellow-600">Sin Asignar</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.entregadas}</div>
              <div className="text-sm text-purple-600">Entregadas</div>
            </div>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                name="estado"
                value={filtros.estado}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todas">Todas</option>
                <option value="en_construccion">En Construcción</option>
                <option value="terminada">Terminada</option>
                <option value="entregada">Entregada</option>
                <option value="en_mantenimiento">En Mantenimiento</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asignación
              </label>
              <select
                name="asignacion"
                value={filtros.asignacion}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todas">Todas</option>
                <option value="asignadas">Asignadas</option>
                <option value="sin_asignar">Sin Asignar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proyecto
              </label>
              <select
                name="proyecto"
                value={filtros.proyecto}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos</option>
                {proyectos.map((proyecto) => (
                  <option key={proyecto.id} value={proyecto.id}>
                    {proyecto.nombre}
                  </option>
                ))}
              </select>
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

        <SectionPanel title={`Viviendas (${filteredViviendas.length})`}>
          <div className="grid gap-4">
            {filteredViviendas.length > 0 ? (
              filteredViviendas.map((vivienda) => (
                <div key={vivienda.id_vivienda} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-sm transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{vivienda.direccion}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vivienda.estado)}`}>
                          {getStatusText(vivienda.estado)}
                        </span>
                        {vivienda.beneficiario_uid ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Asignada
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            Sin Asignar
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Proyecto:</span> {vivienda.proyecto_nombre || 'Sin proyecto'}
                        </div>
                        <div>
                          <span className="font-medium">Tipo:</span> {vivienda.tipo_vivienda || 'No especificado'}
                        </div>
                        <div>
                          <span className="font-medium">Fecha Entrega:</span> {formatDate(vivienda.fecha_entrega)}
                        </div>
                      </div>

                      {vivienda.beneficiario_uid ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="text-sm">
                            <span className="font-medium text-green-800">Beneficiario Asignado:</span>
                            <div className="mt-1 text-green-700">
                              {vivienda.beneficiario_nombre} ({vivienda.beneficiario_email})
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="text-sm text-yellow-800">
                            <span className="font-medium">Estado:</span> Vivienda sin asignar
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      {vivienda.beneficiario_uid ? (
                        <>
                          <button 
                            onClick={() => openAssignModal(vivienda)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Reasignar
                          </button>
                          <button 
                            onClick={() => handleUnassign(vivienda)}
                            className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50"
                          >
                            Desasignar
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => openAssignModal(vivienda)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Asignar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay viviendas que coincidan con los filtros seleccionados</p>
              </div>
            )}
          </div>
        </SectionPanel>

        {/* Modal de Asignación */}
        <Modal isOpen={showAssignModal} onClose={closeAssignModal} maxWidth="max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {selectedVivienda?.beneficiario_uid ? 'Reasignar Vivienda' : 'Asignar Vivienda'}
              </h3>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Vivienda:</span> {selectedVivienda?.direccion}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Proyecto:</span> {selectedVivienda?.proyecto_nombre || 'Sin proyecto'}
                </p>
                {selectedVivienda?.beneficiario_uid && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Actual:</span> {selectedVivienda?.beneficiario_nombre}
                  </p>
                )}
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
                    {loading ? 'Procesando...' : 'Asignar Vivienda'}
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