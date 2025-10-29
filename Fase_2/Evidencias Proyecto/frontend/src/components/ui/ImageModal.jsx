import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

/**
 * ImageModal
 * - Muestra una imagen en un modal a pantalla completa.
 * - Controles de zoom (+/-) y reset.
 * - Botón para descargar la imagen.
 */
export default function ImageModal({ open, src, alt = 'imagen', onClose, downloadable = true }) {
  const [zoom, setZoom] = useState(1)
  const viewerRef = useRef(null)
  const imgRef = useRef(null)
  
  function filenameFromUrl(url) {
    try {
      const u = new URL(url)
      const name = u.pathname.split('/').filter(Boolean).pop()
      return name || 'imagen.jpg'
    } catch { return 'imagen.jpg' }
  }
  
  async function handleDownload() {
    try {
      const res = await fetch(src, { mode: 'cors' })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filenameFromUrl(src)
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1500)
    } catch {
      // Fallback: abrir en nueva pestaña para que el usuario guarde manualmente
      window.open(src, '_blank', 'noopener,noreferrer')
    }
  }

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape' || e.key === 'Enter') onClose?.()
      // Las teclas se manejan dentro del wrapper (se pasan via props más abajo)
    }
    window.addEventListener('keydown', onKey)
    // Bloquear scroll del body mientras el modal esté abierto
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  useEffect(() => { if (open) setZoom(1) }, [open])

  // zoom se actualizará desde TransformWrapper via onTransformed

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-[2px] flex flex-col" role="dialog" aria-modal="true" style={{ zIndex: 2147483647 }} onClick={(e)=>{ if(e.target===e.currentTarget) onClose?.() }}>
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        wheel={{ step: 0.2 }}
        doubleClick={{ disabled: true }}
        limitToBounds={true}
        centerOnInit={true}
        centerZoomedOut={true}
        onTransformed={(ref) => setZoom(Number(ref.state.scale.toFixed(2)))}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Barra de Herramientas */}
            <div className="z-50 bg-gray-900/95 border-b border-gray-800 py-2 px-3 md:px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-700/70 rounded-md border border-gray-600 overflow-hidden">
                  <button className="px-3 py-1.5 text-gray-100 hover:bg-gray-600" onClick={() => zoomOut()}>-</button>
                  <span className="px-4 text-sm text-gray-200 select-none">{Math.round(zoom*100)}%</span>
                  <button className="px-3 py-1.5 text-gray-100 hover:bg-gray-600" onClick={() => zoomIn()}>+</button>
                  <button className="px-3 py-1.5 text-gray-100 hover:bg-gray-600" onClick={() => { resetTransform(); setZoom(1) }}>Reset</button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {downloadable && (
                  <button className="bg-blue-600 hover:bg-blue-500 text-white rounded-md px-4 py-2" onClick={handleDownload}>Descargar</button>
                )}
                <button className="bg-gray-600 hover:bg-gray-500 text-gray-100 rounded-md px-4 py-2" onClick={onClose}>Cerrar</button>
              </div>
            </div>
            {/* Lienzo */}
            <div ref={viewerRef} className="flex-1 overflow-hidden grid place-items-center p-2 md:p-4 cursor-grab active:cursor-grabbing" onClick={(e)=>{ if(e.target===e.currentTarget) onClose?.() }}>
              <TransformComponent wrapperClass="w-full h-full overflow-hidden grid place-items-center" contentClass="select-none">
                <img
                  ref={imgRef}
                  src={src}
                  alt={alt}
                  className="block w-auto h-auto max-w-full max-h-[85vh] rounded shadow-2xl select-none"
                  draggable={false}
                />
              </TransformComponent>
            </div>
          </>
        )}
      </TransformWrapper>
    </div>
  , document.body)
}
