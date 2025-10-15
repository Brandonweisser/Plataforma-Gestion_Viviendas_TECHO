import React from 'react';
import { Link } from 'react-router-dom';

/**
 * ActionCard
 * Tarjeta de acción principal para accesos rápidos.
 * Mantiene la lógica externa (onClick) sin asumir navegación.
 */
export function ActionCard({ title, description, badge, urgent, onClick, to, icon, accent = 'blue', cta }) {
  const accentMap = {
    blue: 'bg-techo-blue-50 text-techo-blue-600 dark:bg-techo-blue-500/15 dark:text-techo-blue-300',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300',
    green: 'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-300',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300',
    red: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
    teal: 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300',
    cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300'
  };
  const accentClasses = accentMap[accent] || accentMap.blue;
  return (
    <div className={`card-surface card-interactive relative flex flex-col h-full ${urgent ? 'border border-red-200 bg-red-50/60 dark:bg-red-500/10' : ''}`}
         role="group" aria-label={title}>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {icon && (
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${accentClasses}`} aria-hidden>
                {icon}
              </span>
            )}
            <h4 className="text-sm font-semibold uppercase tracking-wide text-techo-blue-700 dark:text-techo-blue-300">
              {title}
            </h4>
          </div>
          {badge && (
            <span className={`badge ${urgent ? 'badge-danger' : 'badge-success'} whitespace-nowrap`}>{badge}</span>
          )}
        </div>
        <p className="text-xs text-techo-gray-500 dark:text-techo-gray-400 flex-1 mb-4 line-clamp-3">
          {description}
        </p>
        {to ? (
          <Link
            to={to}
            className={`mt-auto w-full text-center ${urgent ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500 text-white dark:shadow-none btn' : 'btn-primary bg-gradient-to-r from-techo-blue-600 to-techo-blue-500 hover:from-techo-blue-700 hover:to-techo-blue-600 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-techo-blue-400 text-white shadow-sm'}`}
            aria-label={urgent ? `${title} - acción urgente` : title}
            onClick={onClick}
          >
            {cta || (urgent ? 'Reportar ahora' : 'Acceder')}
          </Link>
        ) : (
          <button
            onClick={onClick}
            className={`mt-auto w-full ${urgent ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500 text-white dark:shadow-none btn' : 'btn-primary bg-gradient-to-r from-techo-blue-600 to-techo-blue-500 hover:from-techo-blue-700 hover:to-techo-blue-600 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-techo-blue-400 text-white shadow-sm'}`}
            aria-label={urgent ? `${title} - acción urgente` : title}
          >
            {cta || (urgent ? 'Reportar ahora' : 'Acceder')}
          </button>
        )}
      </div>
      {urgent && (
        <span className="absolute top-2 right-2 animate-pulse text-red-500 text-xs font-semibold" aria-hidden>URGENTE</span>
      )}
    </div>
  );
}
