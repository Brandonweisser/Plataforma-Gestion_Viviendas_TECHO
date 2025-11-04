import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { XMarkIcon, UserIcon } from '@heroicons/react/24/outline'
import { tecnicoApi } from '../services/api'
import { getRoleName } from '../utils/roleNames'

/**
 * Modal para asignar incidencia a un técnico de campo
 * Solo visible para supervisores (tecnico y administrador)
 */
export default function AsignarTecnicoModal({ incidenciaId, incidencia, onClose, onSuccess }) {
  const [tecnicos, setTecnicos] = useState([])
  const [selectedTecnico, setSelectedTecnico] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingTecnicos, setLoadingTecnicos] = useState(true)
  const [error, setError] = useState('')
  const [tecnicoAsignado, setTecnicoAsignado] = useState(null)

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    loadTecnicos()
    loadTecnicoAsignado()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadTecnicoAsignado() {
    // Si la incidencia tiene técnico asignado, buscarlo en la lista
    if (incidencia?.id_usuario_tecnico) {
      try {
        const response = await tecnicoApi.listarTecnicosDisponibles()
        if (response.success) {
          const asignado = response.data?.find(t => t.uid === incidencia.id_usuario_tecnico)
          setTecnicoAsignado(asignado || null)
        }
      } catch (err) {
        console.error('Error cargando técnico asignado:', err)
      }
    }
  }

  async function loadTecnicos() {
    try {
      setLoadingTecnicos(true)
      const response = await tecnicoApi.listarTecnicosDisponibles()
      
      if (response.success) {
        setTecnicos(response.data || [])
      } else {
        setError('Error al cargar técnicos')
      }
    } catch (err) {
      console.error('Error cargando técnicos:', err)
      setError('No se pudo cargar la lista de técnicos')
    } finally {
      setLoadingTecnicos(false)
    }
  }

  async function handleAsignar() {
    if (!selectedTecnico) {
      setError('Debes seleccionar un técnico')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const response = await tecnicoApi.asignarIncidenciaATecnico(incidenciaId, selectedTecnico)
      
      if (response.success) {
        onSuccess && onSuccess(response.data)
        onClose()
      } else {
        setError(response.message || 'Error al asignar técnico')
      }
    } catch (err) {
      console.error('Error asignando técnico:', err)
      setError('No se pudo asignar el técnico')
    } finally {
      setLoading(false)
    }
  }

  async function handleDesasignar() {
    try {
      setLoading(true)
      setError('')
      
      // Usar tecnico_uid null para desasignar
      const response = await tecnicoApi.asignarIncidenciaATecnico(incidenciaId, null)
      
      if (response.success) {
        setTecnicoAsignado(null)
        onSuccess && onSuccess(response.data)
        onClose()
      } else {
        setError(response.message || 'Error al desasignar técnico')
      }
    } catch (err) {
      console.error('Error desasignando técnico:', err)
      setError('No se pudo desasignar el técnico')
    } finally {
      setLoading(false)
    }
  }

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-[9999]"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={onClose}
    >
      <div className="min-h-screen px-4 flex items-center justify-center">
        <div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 rounded-t-xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Asignar Técnico a Incidencia
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

        {/* Body */}
        <div className="p-8 space-y-5">
          {/* Técnico Actualmente Asignado */}
          {tecnicoAsignado && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full">
                    <UserIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Técnico Asignado
                    </p>
                    <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {tecnicoAsignado.nombre}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getRoleName(tecnicoAsignado.rol)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDesasignar}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 
                           hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed border border-red-300 dark:border-red-800"
                >
                  {loading ? 'Desasignando...' : 'Desasignar'}
                </button>
              </div>
            </div>
          )}

          <p className="text-base text-gray-600 dark:text-gray-400">
            {tecnicoAsignado ? 'O reasigna a otro técnico:' : 'Selecciona un técnico para asignar esta incidencia:'}
          </p>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-base text-red-600 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}

          {loadingTecnicos ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent"></div>
              <p className="text-base text-gray-500 mt-4">Cargando técnicos...</p>
            </div>
          ) : tecnicos.length === 0 ? (
            <div className="text-center py-12">
              <UserIcon className="w-16 h-16 mx-auto text-gray-400 mb-3" />
              <p className="text-base text-gray-500">No hay técnicos disponibles</p>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300">
                Técnico
              </label>
              <select
                value={selectedTecnico}
                onChange={(e) => setSelectedTecnico(e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                disabled={loading}
              >
                <option value="">Selecciona un técnico...</option>
                {tecnicos.map((tec) => (
                  <option key={tec.uid} value={tec.uid}>
                    {tec.nombre} - {getRoleName(tec.rol)} 
                    {tec.incidencias_activas > 0 && ` (${tec.incidencias_activas} activas)`}
                  </option>
                ))}
              </select>

              {/* Info de carga de trabajo */}
              {selectedTecnico && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {(() => {
                      const tec = tecnicos.find(t => t.uid === selectedTecnico)
                      if (!tec) return ''
                      const carga = tec.incidencias_activas || 0
                      if (carga === 0) return `${tec.nombre} no tiene incidencias activas`
                      if (carga < 5) return `${tec.nombre} tiene carga baja (${carga} incidencias)`
                      if (carga < 10) return `${tec.nombre} tiene carga media (${carga} incidencias)`
                      return `${tec.nombre} tiene carga alta (${carga} incidencias)`
                    })()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-3 text-base font-medium text-gray-700 dark:text-gray-300 
                     hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleAsignar}
            className="px-6 py-3 text-base font-medium text-white bg-blue-600 
                     hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 
                     disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            disabled={loading || !selectedTecnico || loadingTecnicos}
          >
            {loading ? 'Asignando...' : 'Asignar Técnico'}
          </button>
        </div>
      </div>
      </div>
    </div>
  )

  return ReactDOM.createPortal(modalContent, document.body)
}
