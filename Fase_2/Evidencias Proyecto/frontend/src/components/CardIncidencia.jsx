import React from 'react'
import { ClockIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

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

	// Procesamiento de plazos legales
	const plazos = incidencia.plazos_legales
	const mostrarPlazos = plazos && !['cerrada', 'cancelada'].includes((incidencia.estado || '').toLowerCase())

	const plazoIndicador = mostrarPlazos ? (() => {
		const { estado_plazo, dias_restantes, fecha_limite_resolucion } = plazos

		if (estado_plazo === 'vencido') {
			return {
				icon: ExclamationTriangleIcon,
				color: 'text-red-600 dark:text-red-400',
				bgColor: 'bg-red-50 dark:bg-red-900/20',
				borderColor: 'border-red-200 dark:border-red-700',
				texto: '⚠️ Plazo vencido',
				detalle: `Debió resolverse el ${fecha_limite_resolucion?.split('T')[0] || 'N/A'}`
			}
		} else if (estado_plazo === 'proximo_vencer') {
			return {
				icon: ClockIcon,
				color: 'text-yellow-600 dark:text-yellow-400',
				bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
				borderColor: 'border-yellow-200 dark:border-yellow-700',
				texto: `⏰ ${dias_restantes} día${dias_restantes !== 1 ? 's' : ''} restante${dias_restantes !== 1 ? 's' : ''}`,
				detalle: `Límite: ${fecha_limite_resolucion?.split('T')[0] || 'N/A'}`
			}
		} else if (estado_plazo === 'dentro_plazo') {
			return {
				icon: CheckCircleIcon,
				color: 'text-green-600 dark:text-green-400',
				bgColor: 'bg-green-50 dark:bg-green-900/20',
				borderColor: 'border-green-200 dark:border-green-700',
				texto: `✓ ${dias_restantes} día${dias_restantes !== 1 ? 's' : ''} restante${dias_restantes !== 1 ? 's' : ''}`,
				detalle: `Límite: ${fecha_limite_resolucion?.split('T')[0] || 'N/A'}`
			}
		}
		return null
	})() : null

	const garantiaChip = (() => {
		const tipo = incidencia.garantia_tipo
		if (!tipo) return null
		const vigente = incidencia.garantia_vigente
		const vence = incidencia.garantia_vence_el
		const labelMap = { terminaciones: 'Terminaciones', instalaciones: 'Instalaciones', estructura: 'Estructural' }
		const tone = vigente === false ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
		return (
			<span title={vence ? `Vence: ${vence}` : ''} className={`px-2 py-0.5 rounded-full text-[11px] ${tone}`}>
				{labelMap[tipo] || tipo}{vigente != null ? (vigente ? ' · Vigente' : ' · Vencida') : ''}
			</span>
		)
	})()

	return (
		<div className={`bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 p-4 md:p-5 mb-4 ${className}`}>
			<div className={`grid items-start gap-4 ${hasPreview ? 'grid-cols-[80px,1fr] md:grid-cols-[100px,1fr,auto]' : 'grid-cols-[1fr]'}`}>
				{hasPreview && (
					<div className='shrink-0'>
						<img
							src={firstThumb.url}
							alt='foto incidencia'
							className='h-20 w-20 md:h-24 md:w-24 object-cover rounded-xl border-2 border-slate-300 dark:border-slate-600 shadow-sm'
						/>
					</div>
				)}

				<div className='min-w-0 space-y-3'>
					{/* Encabezado con número y estado */}
					<div className='flex flex-wrap items-center gap-2'>
						<span className='inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-700'>
							#{incidencia.id_incidencia}
						</span>
						<span className={`px-3 py-1 rounded-lg text-xs font-semibold ${statusColor(incidencia.estado)}`}>
							{incidencia.estado}
						</span>
						{garantiaChip}
					</div>

					{/* Descripción principal */}
					<div className='font-bold text-base md:text-lg text-slate-900 dark:text-white leading-tight line-clamp-2'>
						{incidencia.descripcion || 'Sin descripción'}
					</div>

					{/* Metadatos en badges */}
					<div className='flex flex-wrap gap-2'>
						<span className='inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'>
							📂 {incidencia.categoria || '—'}
						</span>
						<span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${prioridadColor(incidencia.prioridad)} ${
							(incidencia.prioridad || '').toLowerCase() === 'alta' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' :
							(incidencia.prioridad || '').toLowerCase() === 'media' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700' :
							'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
						}`}>
							⚠️ {(incidencia.prioridad || '—').toUpperCase()}
						</span>
						{media.length > 0 && (
							<span className='inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-sky-50 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border border-sky-200 dark:border-sky-700'>
								📸 {media.length} foto{media.length > 1 ? 's' : ''}
							</span>
						)}
						<span className='inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-slate-50 text-slate-500 dark:bg-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-600'>
							📅 {(incidencia.fecha_reporte || '').split('T')[0]}
						</span>
					</div>

					{mostrarPlazos && plazoIndicador && (
						<div className={`p-3 rounded-xl ${plazoIndicador.bgColor} border-2 ${plazoIndicador.borderColor} flex items-start gap-2.5 shadow-sm`}>
							<plazoIndicador.icon className={`w-5 h-5 ${plazoIndicador.color} flex-shrink-0 mt-0.5`} />
							<div className='flex-1 min-w-0'>
								<div className={`text-sm font-bold ${plazoIndicador.color}`}>
									{plazoIndicador.texto}
								</div>
								<div className='text-xs text-slate-700 dark:text-slate-300 mt-1'>
									{plazoIndicador.detalle}
								</div>
							</div>
						</div>
					)}

					{media.length > 1 && (
						<div className='flex gap-2 overflow-x-auto pb-1'>
							{media.slice(1, 6).map(m => (
								<img key={m.id || m.url} src={m.url} alt='foto' className='h-14 w-14 md:h-16 md:w-16 object-cover rounded-lg border-2 border-slate-300 dark:border-slate-600 flex-shrink-0 shadow-sm' />
							))}
							{media.length > 6 && (
								<div className='h-14 w-14 md:h-16 md:w-16 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 font-semibold flex-shrink-0'>
									+{media.length - 6}
								</div>
							)}
						</div>
					)}
				</div>

				{/* Botón de acción en desktop */}
				<div className='hidden md:flex flex-col items-end gap-2'>
					{typeof onOpen === 'function' && (
						<button className='btn-outline btn-sm whitespace-nowrap' onClick={() => onOpen(incidencia)}>
							Ver detalle
						</button>
					)}
					{allowUpload && typeof onUploadClick === 'function' && (
						<button className='btn-primary btn-sm whitespace-nowrap' onClick={() => onUploadClick(incidencia)}>
							Agregar fotos
						</button>
					)}
					{incidencia.estado === 'resuelta' && (
						<span className='inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'>Pendiente validación</span>
					)}
				</div>
			</div>

			{/* Botones de acción en móvil (abajo de todo) */}
			<div className='md:hidden mt-4 pt-4 border-t-2 border-slate-200 dark:border-slate-700 flex flex-col gap-2'>
				{incidencia.estado === 'resuelta' && (
					<div className='px-3 py-2 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 text-sm font-semibold text-center border-2 border-amber-200 dark:border-amber-700'>
						⏳ Pendiente de tu validación
					</div>
				)}
				<div className='flex gap-2'>
					{typeof onOpen === 'function' && (
						<button className='btn-outline flex-1 text-sm py-2.5 font-semibold' onClick={() => onOpen(incidencia)}>
							📋 Ver detalle
						</button>
					)}
					{allowUpload && typeof onUploadClick === 'function' && (
						<button className='btn-primary flex-1 text-sm py-2.5 font-semibold' onClick={() => onUploadClick(incidencia)}>
							📸 Agregar fotos
						</button>
					)}
				</div>
			</div>
		</div>
	)
}

