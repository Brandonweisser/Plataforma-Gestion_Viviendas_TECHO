import React from 'react'

export function Toast({ type = 'info', message, onClose }) {
  if (!message) return null
  const palette = {
    success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', btn: 'text-emerald-600 hover:text-emerald-700' },
    error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', btn: 'text-red-600 hover:text-red-700' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', btn: 'text-blue-600 hover:text-blue-700' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', btn: 'text-amber-700 hover:text-amber-800' }
  }[type] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', btn: 'text-gray-600 hover:text-gray-700' }
  return (
    <div className={`${palette.bg} border ${palette.border} ${palette.text} px-4 py-3 rounded-lg flex items-start justify-between gap-3`}>
      <div className="text-sm">{message}</div>
      {onClose && (
        <button onClick={onClose} className={`text-sm ${palette.btn}`} aria-label="Cerrar">×</button>
      )}
    </div>
  )
}
