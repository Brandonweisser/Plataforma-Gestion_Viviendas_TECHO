import React from 'react'

// Formatea una fecha ISO (YYYY-MM-DD o ISO completo) a español: "15 de marzo, 2023"
function formatDateSpanish(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch (_) {
    return '—'
  }
}

export function ViviendaDetalles({ vivienda }) {
  const direccion = vivienda?.direccion || vivienda?.direccion_principal || 'No registrada'
  const tipo = vivienda?.tipo_vivienda || '—'
  const m2 = typeof vivienda?.metros_cuadrados === 'number' ? `${vivienda.metros_cuadrados} m²` : (vivienda?.metros_cuadrados ? `${vivienda.metros_cuadrados} m²` : '—')
  const fechaEntrega = formatDateSpanish(vivienda?.fecha_entrega)

  return (
    <ul className="space-y-2 text-techo-gray-700 dark:text-techo-gray-200">
      <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Dirección:</span> {direccion}</li>
      <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Tipo:</span> {tipo}</li>
      <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Metros cuadrados:</span> {m2}</li>
      <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Fecha de entrega:</span> {fechaEntrega}</li>
    </ul>
  )
}

export function ContactoEmergencia({ tecnico }) {
  const nombre = tecnico?.nombre || 'Sin asignar'
  const telefono = tecnico?.telefono || '—'
  const email = tecnico?.email || '—'
  const horario = tecnico?.horario || '—'

  return (
    <ul className="space-y-2 text-techo-gray-700 dark:text-techo-gray-200">
      <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Técnico asignado:</span> {nombre}</li>
      <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Teléfono:</span> {telefono}</li>
      <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Email:</span> {email}</li>
      <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Horario:</span> {horario}</li>
    </ul>
  )
}

// Componente compuesto opcional que dibuja ambos paneles en una grilla
export default function CardVivienda({ vivienda, tecnico }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-techo-gray-500 mb-2">Detalles generales</h4>
          <ViviendaDetalles vivienda={vivienda} />
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-techo-gray-500 mb-2">Contacto de emergencia</h4>
        <ContactoEmergencia tecnico={tecnico} />
      </div>
    </div>
  )
}
