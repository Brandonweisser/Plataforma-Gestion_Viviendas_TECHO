import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { XMarkIcon, UserIcon, ChevronDownIcon, ChevronUpIcon, MapPinIcon, ExclamationTriangleIcon, CheckCircleIcon, CalendarIcon, LightBulbIcon } from '@heroicons/react/24/outline'
import { tecnicoApi } from '../services/api'
import { getRoleName } from '../utils/roleNames'

/**
 * Modal para asignar incidencia a un técnico de campo
 * Solo visible para supervisores (tecnico y administrador)
 */
export default function AsignarTecnicoModal({ incidenciaId, incidencia, onClose, onSuccess }) {
  const [tecnicos, setTecnicos] = useState([])
  const [selectedTecnico, setSelectedTecnico] = useState('')
  const [fechaVisitaSugerida, setFechaVisitaSugerida] = useState('')
  const [expandedTecnico, setExpandedTecnico] = useState(null)
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
      
      // Preparar payload con fecha opcional
      const payload = { tecnico_uid: selectedTecnico }
      if (fechaVisitaSugerida) {
        payload.fecha_visita_sugerida = fechaVisitaSugerida
      }
      
      const response = await tecnicoApi.asignarIncidenciaATecnico(incidenciaId, payload)
      
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
      <div className="min-h-screen px-4 py-8 flex items-center justify-center">
        <div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 rounded-t-xl flex-shrink-0">
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

        {/* Body con scroll */}
        <div className="p-8 space-y-5 overflow-y-auto flex-1 scrollbar-thin">
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
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Selecciona un Técnico
              </label>
              
              <div className="space-y-2">
                {tecnicos.map((tec) => {
                  const carga = tec.incidencias_activas || 0
                  const isExpanded = expandedTecnico === tec.uid
                  const isSelected = selectedTecnico === tec.uid
                  
                  // Determinar color del badge según carga
                  let badgeColor = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  let badgeText = 'Disponible'
                  if (carga >= 6) {
                    badgeColor = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    badgeText = 'Saturado'
                  } else if (carga >= 3) {
                    badgeColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    badgeText = 'Carga media'
                  }

                  return (
                    <div
                      key={tec.uid}
                      className={`border-2 rounded-lg transition-all duration-200 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                      }`}
                    >
                      {/* Header de la card del técnico */}
                      <div 
                        className="p-4 cursor-pointer"
                        onClick={() => setSelectedTecnico(tec.uid)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Radio + Info del técnico */}
                          <div className="flex items-start gap-3 flex-1">
                            <input
                              type="radio"
                              name="tecnico"
                              checked={isSelected}
                              onChange={() => setSelectedTecnico(tec.uid)}
                              className="mt-1 w-5 h-5 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                  {tec.nombre}
                                </h4>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>
                                  {badgeText}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                {getRoleName(tec.rol)}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {carga} incidencia{carga !== 1 ? 's' : ''} activa{carga !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Botón expandir/colapsar */}
                          {carga > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedTecnico(isExpanded ? null : tec.uid)
                              }}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUpIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              ) : (
                                <ChevronDownIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Lista expandible de incidencias */}
                      {isExpanded && carga > 0 && (
                        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                              Incidencias asignadas
                            </p>
                            {tec.incidencias?.map((inc, idx) => {
                              const plazos = inc.plazos_legales
                              const diasRestantes = plazos?.dias_restantes
                              const estadoPlazo = plazos?.estado_plazo
                              
                              return (
                              <div 
                                key={inc.id}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                      #{inc.id} - {inc.titulo || 'Sin título'}
                                    </p>
                                    {inc.direccion && (
                                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                                        <MapPinIcon className='w-3.5 h-3.5' />
                                        {inc.direccion}
                                      </p>
                                    )}
                                    
                                    {/* Indicador de días restantes */}
                                    {plazos && diasRestantes !== null && (
                                      <div className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-md text-xs font-medium ${
                                        estadoPlazo === 'vencido'
                                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                          : estadoPlazo === 'proximo_vencer'
                                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                      }`}>
                                        {estadoPlazo === 'vencido' ? (
                                          <>
                                            <ExclamationTriangleIcon className='w-3.5 h-3.5' />
                                            <span>Plazo vencido</span>
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircleIcon className='w-3.5 h-3.5' />
                                            <span>{diasRestantes} día{diasRestantes !== 1 ? 's' : ''} restante{diasRestantes !== 1 ? 's' : ''}</span>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                                    inc.estado === 'abierta' 
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                      : inc.estado === 'en_proceso'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                      : inc.estado === 'en_espera'
                                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                  }`}>
                                    {inc.estado === 'abierta' ? 'Abierta' 
                                      : inc.estado === 'en_proceso' ? 'En proceso' 
                                      : inc.estado === 'en_espera' ? 'En espera'
                                      : inc.estado}
                                  </span>
                                </div>
                              </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/*  Fecha de Visita Sugerida (Opcional) */}
          {!loadingTecnicos && tecnicos.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300">
                 Fecha Sugerida de Visita <span className="text-sm font-normal text-gray-500">(Opcional)</span>
              </label>
              
              <div className="space-y-2">
                {/* Botones rápidos */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setFechaVisitaSugerida(new Date().toISOString().split('T')[0])}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 
                             dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 
                             rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400"></span>
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const manana = new Date()
                      manana.setDate(manana.getDate() + 1)
                      setFechaVisitaSugerida(manana.toISOString().split('T')[0])
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 
                             dark:text-green-400 dark:bg-green-900/20 dark:hover:bg-green-900/40 
                             rounded-lg transition-colors border border-green-200 dark:border-green-800"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-green-600 dark:bg-green-400"></span>
                    Mañana
                  </button>
                  <button
                    type="button"
                    onClick={() => setFechaVisitaSugerida('')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 
                             dark:text-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 
                             rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-400 dark:bg-gray-500"></span>
                    Sin fecha
                  </button>
                </div>

                {/* Input de fecha con placeholder visible */}
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={fechaVisitaSugerida}
                    onChange={(e) => setFechaVisitaSugerida(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    placeholder="Selecciona una fecha"
                    className="w-full pl-10 pr-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 
                             rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                             dark:bg-gray-700 dark:text-gray-100 transition-all
                             placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <LightBulbIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {fechaVisitaSugerida 
                      ? 'Esta incidencia aparecerá en la agenda del técnico para el día seleccionado.'
                      : 'Si no eliges fecha, aparecerá automáticamente según prioridad y plazos legales.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fijo al final */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 rounded-b-xl flex-shrink-0">
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
