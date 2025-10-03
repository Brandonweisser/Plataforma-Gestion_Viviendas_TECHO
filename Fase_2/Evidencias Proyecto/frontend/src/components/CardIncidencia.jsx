import React from 'react'

export default function CardIncidencia({ incidencia, onUploadClick, onOpen, allowUpload = false, className = '' }) {
	if (!incidencia) return null

	const statusColor = (s) => {
		const v = (s || '').toLowerCase()
		if (v.includes('cerr')) return 'bg-green-100 text-green-700'
		if (v.includes('progres')) return 'bg-amber-100 text-amber-700'
		return 'bg-gray-100 text-gray-700'
	}
	const prColor = (p) => {
		const v = (p || '').toLowerCase()
		if (v === 'alta') return 'text-red-600'
		if (v === 'media') return 'text-yellow-600'
		if (v === 'baja') return 'text-green-600'
		return 'text-gray-600'
	}

	const media = Array.isArray(incidencia.media) ? incidencia.media : []

	return (
		<div className={`rounded-lg border bg-white p-4 shadow-sm ${className}`}>
			<div className='flex items-start justify-between gap-4'>
				<div className='flex-1 min-w-0'>
					<div className='flex items-center gap-2 mb-1'>
						<span className='text-xs font-mono text-techo-gray-500'>#{incidencia.id_incidencia}</span>
						<span className={`px-2 py-0.5 rounded-full text-[11px] ${statusColor(incidencia.estado)}`}>{incidencia.estado}</span>
							{media.length > 0 && (
								<span className='px-2 py-0.5 rounded-full text-[11px] bg-sky-100 text-sky-700'>{media.length} foto{media.length>1?'s':''}</span>
							)}
					</div>
					<div className='font-medium text-techo-gray-900 truncate'>{incidencia.descripcion}</div>
					<div className='text-xs text-techo-gray-500 mt-1'>
						<span className='mr-3'>Categoría: {incidencia.categoria || '—'}</span>
						<span className={prColor(incidencia.prioridad)}>Prioridad: {(incidencia.prioridad || '—').toUpperCase()}</span>
					</div>
					<div className='text-[11px] text-techo-gray-400 mt-1'>Fecha: {(incidencia.fecha_reporte || '').split('T')[0]}</div>
				</div>
						<div className='flex flex-col items-end gap-2'>
							{typeof onOpen === 'function' && (
								<button className='btn-outline btn-sm' onClick={() => onOpen(incidencia)}>Ver detalle</button>
							)}
							{allowUpload && typeof onUploadClick === 'function' && (
								<button className='btn-primary btn-sm' onClick={() => onUploadClick(incidencia)}>Agregar fotos</button>
							)}
				</div>
			</div>
			{media.length > 0 && (
				<div className='mt-3 flex gap-2 overflow-x-auto'>
					{media.slice(0, 5).map(m => (
						<img key={m.id || m.url} src={m.url} alt='foto' className='h-16 w-16 object-cover rounded border' />
					))}
				</div>
			)}
		</div>
	)
}

