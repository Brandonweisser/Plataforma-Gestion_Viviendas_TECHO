import React from 'react';

/**
 * StatCard: indicador resumido.
 */
export function StatCard({ icon, label, value, subtitle, color = 'techo-blue-600', ariaLabel }) {
  return (
    <div className="card-surface p-4 sm:p-5 flex items-center gap-4" aria-label={ariaLabel || label}>
      <div className={`p-3 rounded-lg bg-techo-blue-50 text-techo-blue-600 text-xl`} aria-hidden>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium uppercase tracking-wide text-techo-gray-500">{label}</span>
        <span className="text-lg font-semibold text-techo-gray-800">{value}</span>
        {subtitle && <span className="text-xs text-techo-gray-500">{subtitle}</span>}
      </div>
    </div>
  );
}
