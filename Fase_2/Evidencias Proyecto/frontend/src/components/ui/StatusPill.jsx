import React from 'react'

const COLOR_MAP = {
  entregada: 'bg-green-100 text-green-800',
  asignada: 'bg-yellow-100 text-yellow-800',
  en_proceso: 'bg-blue-100 text-blue-800',
  abierta: 'bg-red-100 text-red-800',
  cerrada: 'bg-gray-100 text-gray-800',
  revisada: 'bg-green-100 text-green-800',
  enviada: 'bg-blue-100 text-blue-800',
  borrador: 'bg-gray-100 text-gray-800'
}

export function StatusPill({ value, className = '' }) {
  const v = (value || '').toLowerCase()
  const color = COLOR_MAP[v] || 'bg-gray-100 text-gray-800'
  return (
    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${color} ${className}`}>{String(value).replace('_',' ')}</span>
  )
}
