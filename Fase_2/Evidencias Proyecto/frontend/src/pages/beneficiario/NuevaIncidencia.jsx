import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../../components/ui/DashboardLayout'
import { SectionPanel } from '../../components/ui/SectionPanel'
import { beneficiarioApi } from '../../services/api'

export default function NuevaIncidencia() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    descripcion: '',
    categoria: ''
  })
  const [files, setFiles] = useState([])


  const handleInputChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    if (selectedFiles.length > 5) {
      setError('Máximo 5 archivos permitidos')
      return
    }
    setFiles(selectedFiles)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!form.descripcion.trim()) {
      setError('La descripción es obligatoria')
      return
    }
    
    if (form.descripcion.trim().length < 10) {
      setError('La descripción debe tener al menos 10 caracteres')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('📝 Creando incidencia:', form)
      
      // Crear la incidencia
      const response = await beneficiarioApi.crearIncidencia({
        descripcion: form.descripcion.trim(),
        categoria: form.categoria || 'otro_terminaciones'
      })

      console.log('✅ Incidencia creada:', response.data)

      // Subir archivos si los hay
      if (files.length > 0 && response.data?.id_incidencia) {
        try {
          console.log('📎 Subiendo archivos...')
          await beneficiarioApi.subirMediaIncidencia(response.data.id_incidencia, files)
          console.log('✅ Archivos subidos exitosamente')
        } catch (uploadError) {
          console.error('❌ Error subiendo archivos:', uploadError)
          // No bloqueamos el éxito si los archivos fallan
        }
      }

      // Redirigir con mensaje de éxito
      navigate('/beneficiario/estado-vivienda', { 
        state: { 
          success: 'Incidencia reportada exitosamente. Recibirás una notificación cuando sea asignada a un técnico.' 
        }
      })

    } catch (error) {
      console.error('❌ Error creando incidencia:', error)
      
      if (error.message?.includes('recepción no enviada')) {
        setError('Debes completar y enviar tu recepción de vivienda antes de reportar incidencias.')
      } else if (error.message?.includes('vivienda asignada')) {
        setError('No tienes una vivienda asignada. Contacta a tu coordinador.')
      } else {
        setError(error.message || 'Error al crear la incidencia. Intenta nuevamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate(-1) // Volver a la página anterior
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-3xl mx-auto space-y-6">
        {/* Título con botón integrado */}
        <div className="bg-gradient-to-br from-sky-50 via-white to-blue-50 rounded-2xl shadow-md border-2 border-sky-200 p-4 sm:p-6">
          {/* Botón volver - arriba en móvil, al lado en desktop */}
          <div className="flex justify-end mb-3 sm:hidden">
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors shadow-sm"
              disabled={loading}
            >
              <span>←</span>
              <span>Volver</span>
            </button>
          </div>
          
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="flex-shrink-0 grid place-items-center h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg">
                <span className="text-2xl sm:text-3xl">🔧</span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-sky-800 mb-1 sm:mb-2">Reportar problema</h1>
                <p className="text-xs sm:text-sm md:text-base text-sky-700">
                  Cuéntanos qué ocurre; mientras más detalles nos des, mejor podremos ayudarte.
                </p>
              </div>
            </div>
            {/* Botón solo visible en desktop */}
            <button
              onClick={handleCancel}
              className="hidden sm:flex flex-shrink-0 items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors shadow-sm"
              disabled={loading}
            >
              <span>←</span>
              <span>Volver</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <SectionPanel title="Información del Problema">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Descripción */}
            <div>
              <label htmlFor="descripcion" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Descripción
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                rows={4}
                value={form.descripcion}
                onChange={handleInputChange}
                placeholder="Describe el problema..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical min-h-[100px]"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Recomendado: 20-200 caracteres. Incluye ubicación en la vivienda y hace cuánto ocurre.
              </p>
            </div>

            {/* Categoría (agrupada por tipo de garantía) */}
            <div>
              <label htmlFor="categoria" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Categoría
              </label>
              <select
                id="categoria"
                name="categoria"
                value={form.categoria}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">(Selecciona)</option>
                <optgroup label="Instalaciones (5 años)">
                  <option value="electricidad">Electricidad</option>
                  <option value="tablero electrico">Tablero eléctrico y automáticos</option>
                  <option value="tomas e interruptores">Tomas e interruptores</option>
                  <option value="cableado">Cableado y empalmes</option>
                  <option value="iluminacion">Iluminación fija</option>
                  <option value="gas">Gas (red interior)</option>
                  <option value="agua potable">Agua potable (fría/caliente)</option>
                  <option value="plomeria">Plomería / Gasfitería</option>
                  <option value="artefactos sanitarios">Artefactos sanitarios</option>
                  <option value="desagues">Desagües</option>
                  <option value="alcantarillado">Alcantarillado</option>
                  <option value="aguas lluvias">Aguas lluvias (canaletas y bajadas)</option>
                  <option value="ventilacion">Ventilación / Extracción</option>
                  <option value="calefon">Calefón / Termo / Calefacción</option>
                  <option value="otro_instalaciones">Otro (Instalaciones)</option>
                </optgroup>
                <optgroup label="Terminaciones (3 años)">
                  <option value="pintura">Pintura</option>
                  <option value="revestimientos muro">Revestimientos de muro</option>
                  <option value="yeso carton">Yeso-cartón / Tabiques / Cielos</option>
                  <option value="pisos ceramica">Pisos cerámica</option>
                  <option value="pisos porcelanato">Pisos porcelanato</option>
                  <option value="pisos vinilico">Pisos vinílico</option>
                  <option value="pisos flotante">Pisos flotante</option>
                  <option value="pisos madera">Pisos madera</option>
                  <option value="zocalos">Zócalos</option>
                  <option value="puertas">Puertas</option>
                  <option value="cerraduras">Cerraduras y herrajes</option>
                  <option value="ventanas">Ventanas</option>
                  <option value="vidrios">Vidrios</option>
                  <option value="sellos silicona">Sellos de silicona</option>
                  <option value="tapajuntas">Tapajuntas</option>
                  <option value="molduras">Molduras</option>
                  <option value="muebles cocina">Muebles de cocina</option>
                  <option value="muebles bano">Muebles de baño</option>
                  <option value="cubierta cocina">Cubierta de cocina</option>
                  <option value="otro_terminaciones">Otro (Terminaciones)</option>
                </optgroup>
                <optgroup label="Estructura (10 años)">
                  <option value="fundaciones">Fundaciones / Cimientos</option>
                  <option value="estructura muros">Estructura de muros</option>
                  <option value="estructura techumbre">Estructura de techumbre</option>
                  <option value="losa">Losas</option>
                  <option value="vigas">Vigas</option>
                  <option value="columnas">Columnas</option>
                  <option value="grietas estructurales">Grietas estructurales / Desplomes</option>
                  <option value="estructura escalas">Escalas estructurales</option>
                  <option value="otro_estructura">Otro (Estructura)</option>
                </optgroup>
              </select>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Usa "Otro" si no encaja; el equipo ajustará la categoría luego.
              </p>
            </div>


            {/* Archivos */}
            <div>
              <label htmlFor="files" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Fotos (opcional)
              </label>
              <input
                id="files"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Hasta 5 imágenes (JPG/PNG). Consejo: toma las fotos con buena luz.
              </p>
              
              {files.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">Archivos seleccionados:</p>
                  <ul className="text-sm text-gray-600 mt-1 space-y-1">
                    {files.map((file, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <span>📎</span>
                        <span>{file.name}</span>
                        <span className="text-gray-400">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={loading || !form.descripcion.trim()}
                className="flex-1 px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Enviando...</span>
                  </span>
                ) : (
                  '✓ Enviar reporte'
                )}
              </button>
              
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="sm:w-auto px-6 py-3 border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </SectionPanel>

        {/* Información adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-blue-600 text-lg">ℹ️</div>
            <div className="text-sm">
              <p className="font-medium text-blue-800 mb-1">¿Qué sucede después?</p>
              <ul className="text-blue-700 space-y-1">
                <li>• Tu reporte será revisado por nuestro equipo</li>
                <li>• Se asignará a un técnico especializado</li>
                <li>• Recibirás actualizaciones sobre el progreso</li>
                <li>• El técnico se contactará contigo para coordinar la visita</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}