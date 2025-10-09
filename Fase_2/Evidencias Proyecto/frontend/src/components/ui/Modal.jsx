import React from 'react'
import ReactDOM from 'react-dom'

/**
 * Modal sencillo basado en portal para evitar conflictos de reconciliación con listas
 * Props:
 * - isOpen: boolean
 * - onClose?: () => void
 * - children: contenido del modal (renderizado dentro de un panel)
 * - maxWidth?: tailwind class para ancho máximo (por defecto max-w-2xl)
 */
export function Modal({ isOpen, onClose, children, maxWidth = 'max-w-2xl' }) {
  if (!isOpen) return null

  // Usar un único host estable para todos los modales
  let host = document.getElementById('modal-root')
  if (!host) {
    host = document.createElement('div')
    host.id = 'modal-root'
    document.body.appendChild(host)
  }

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        role="button"
        aria-label="Cerrar modal"
      />
      <div className="absolute inset-0 p-4 flex items-center justify-center">
        <div className={`bg-white rounded-lg shadow-lg w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
          {children}
        </div>
      </div>
    </div>,
    host
  )
}
