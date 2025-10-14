import React from 'react'

export default function CardIncidencia({ incidencia, onUploadClick, onOpen, allowUpload = false, className = '' }) {
	// Hooks deben declararse siempre; evitamos returns antes.
	// Eliminado flujo inline de validación
	if (!incidencia) {
		return <div className={`card-surface p-4 md:p-5 ${className}`} aria-hidden="true" />
	}

	const statusColor = (s) => {
		const v = (s || '').toLowerCase()
		if (v.includes('cerr')) return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
		if (v.includes('proceso') || v.includes('progres')) return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
		return 'bg-slate-100 text-slate-700 dark:bg-slate-600/30 dark:text-slate-200'
	}
	const prioridadColor = (p) => {
		const v = (p || '').toLowerCase()
		if (v === 'alta') return 'text-red-600 dark:text-red-400'
		if (v === 'media') return 'text-yellow-600 dark:text-yellow-300'
		if (v === 'baja') return 'text-green-600 dark:text-green-400'
		return 'text-slate-600 dark:text-slate-300'
	}

	const media = Array.isArray(incidencia.media) ? incidencia.media : []
	const firstThumb = media[0]
	const hasPreview = !!firstThumb

	return (
		<div className={`card-surface card-interactive p-4 md:p-5 ${className}`}>
			<div className={`grid items-start gap-4 ${hasPreview ? 'grid-cols-[72px,1fr,auto] md:grid-cols-[88px,1fr,auto]' : 'grid-cols-[1fr,auto]'}`}>
				{hasPreview && (
					<div className='shrink-0'>
						<img
							src={firstThumb.url}
							alt='foto incidencia'
							className='h-16 w-16 md:h-20 md:w-20 object-cover rounded-lg border border-slate-200 dark:border-slate-600'
						/>
					</div>
				)}

				<div className='min-w-0'>
					<div className='flex flex-wrap items-center gap-2 mb-1'>
						<span className='text-[11px] font-mono text-slate-500 dark:text-slate-400'>#{incidencia.id_incidencia}</span>
						<span className={`px-2 py-0.5 rounded-full text-[11px] ${statusColor(incidencia.estado)}`}>{incidencia.estado}</span>
						{media.length > 0 && (
							<span className='px-2 py-0.5 rounded-full text-[11px] bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300'>
								{media.length} foto{media.length > 1 ? 's' : ''}
							</span>
						)}
					</div>

					<div className='font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2'>
						{incidencia.descripcion || 'Sin descripción'}
					</div>

					<div className='text-xs text-slate-600 dark:text-slate-300 mt-1 flex flex-wrap gap-x-4 gap-y-1'>
						<span>Categoria: <span className='font-medium'>{incidencia.categoria || '—'}</span></span>
						<span className={prioridadColor(incidencia.prioridad)}>
							Prioridad: {(incidencia.prioridad || '—').toUpperCase()}
						</span>
						<span className='text-slate-400 dark:text-slate-400'>
							{(incidencia.fecha_reporte || '').split('T')[0]}
						</span>
					</div>

					{media.length > 1 && (
						<div className='mt-3 flex gap-2 overflow-x-auto'>
							{media.slice(1, 6).map(m => (
								<img key={m.id || m.url} src={m.url} alt='foto' className='h-12 w-12 object-cover rounded-md border border-slate-200 dark:border-slate-600' />
							))}
						</div>
					)}
				</div>

				<div className='flex flex-col items-end gap-2'>
					{typeof onOpen === 'function' && (
						<button className='btn-outline btn-sm' onClick={() => onOpen(incidencia)}>
							Ver detalle
						</button>
					)}
					{allowUpload && typeof onUploadClick === 'function' && (
						<button className='btn-primary btn-sm' onClick={() => onUploadClick(incidencia)}>
							Agregar fotos
						</button>
					)}
					{incidencia.estado === 'resuelta' && (
						<span className='inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'>Pendiente validación</span>
					)}
				</div>
			</div>
		</div>
	)
}

