import React from 'react';

/**
 * ActionCard
 * Tarjeta de acción principal para accesos rápidos.
 * Mantiene la lógica externa (onClick) sin asumir navegación.
 */
export function ActionCard({ title, description, badge, urgent, onClick, icon }) {
  return (
    <div className={`card-surface card-interactive relative flex flex-col h-full ${urgent ? 'border border-red-200 bg-red-50/60' : ''}`}
         role="group" aria-label={title}>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {icon && (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-techo-blue-50 text-techo-blue-600 dark:bg-techo-blue-500/15 dark:text-techo-blue-300" aria-hidden>
                {icon}
              </span>
            )}
            <h4 className="text-sm font-semibold uppercase tracking-wide text-techo-blue-700">
              {title}
            </h4>
          </div>
          {badge && (
            <span className={`badge ${urgent ? 'badge-danger' : 'badge-success'} whitespace-nowrap`}>{badge}</span>
          )}
        </div>
        <p className="text-xs text-techo-gray-500 flex-1 mb-4 line-clamp-3">
          {description}
        </p>
        <button
          onClick={onClick}
          className={`mt-auto w-full btn ${urgent ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500 text-white' : 'btn-primary'}`}
          aria-label={urgent ? `${title} - acción urgente` : title}
        >
          {urgent ? '¡Reportar Ahora!' : 'Acceder'}
        </button>
      </div>
      {urgent && (
        <span className="absolute top-2 right-2 animate-pulse text-red-500 text-xs font-semibold" aria-hidden>URGENTE</span>
      )}
    </div>
  );
}
