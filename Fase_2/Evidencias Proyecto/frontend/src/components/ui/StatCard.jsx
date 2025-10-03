import React from 'react';

/**
 * StatCard: indicador resumido.
 * accent: define combinaciones de color para el ícono (rol / contexto)
 */
export function StatCard({ icon, label, value, subtitle, accent = 'blue', ariaLabel }) {
  const accentMap = {
    blue: { bg: 'bg-techo-blue-50 dark:bg-techo-blue-500/15', text: 'text-techo-blue-600 dark:text-techo-blue-300' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-500/15', text: 'text-orange-600 dark:text-orange-300' },
    green: { bg: 'bg-green-50 dark:bg-green-500/15', text: 'text-green-600 dark:text-green-300' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-500/15', text: 'text-purple-600 dark:text-purple-300' },
    red: { bg: 'bg-red-50 dark:bg-red-500/15', text: 'text-red-600 dark:text-red-300' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-500/15', text: 'text-indigo-600 dark:text-indigo-300' },
    teal: { bg: 'bg-teal-50 dark:bg-teal-500/15', text: 'text-teal-600 dark:text-teal-300' },
    cyan: { bg: 'bg-cyan-50 dark:bg-cyan-500/15', text: 'text-cyan-600 dark:text-cyan-300' }
  };
  const colors = accentMap[accent] || accentMap.blue;
  return (
    <div className="card-surface p-4 sm:p-5 flex items-center gap-4" aria-label={ariaLabel || label}>
      <div className={`p-3 rounded-lg text-xl ${colors.bg} ${colors.text}`} aria-hidden>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium uppercase tracking-wide text-techo-gray-500 dark:text-techo-gray-400">{label}</span>
        <span className="text-lg font-semibold text-techo-gray-800 dark:text-white">{value}</span>
        {subtitle && <span className="text-xs text-techo-gray-500 dark:text-techo-gray-400">{subtitle}</span>}
      </div>
    </div>
  );
}
