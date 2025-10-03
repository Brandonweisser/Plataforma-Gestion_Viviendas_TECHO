import React from 'react';

/**
 * SectionPanel: contenedor seccionado con título y contenido.
 */
export function SectionPanel({ title, description, children, actions, as = 'section', className = '', variant }) {
  const Component = as;
  const isHighlight = variant === 'highlight';
  return (
  <Component className={`card-surface ${isHighlight ? 'relative overflow-hidden card-strong border-techo-blue-100' : ''} ${className} dark:bg-gray-900/40` }>
      {isHighlight && (
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-techo-blue-50 via-techo-cyan-50 to-white" />
      )}
  <div className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${isHighlight ? 'border-b border-techo-blue-100 relative' : 'border-b border-techo-gray-100 dark:border-gray-700'}`}>        
        <div>
          <h3 className={`text-xs sm:text-sm font-semibold tracking-wide uppercase ${isHighlight ? 'text-techo-blue-700 dark:text-techo-blue-300' : 'text-techo-gray-700 dark:text-techo-gray-200'}`}>{title}</h3>
          {description && <p className={`text-[11px] sm:text-xs mt-0.5 ${isHighlight ? 'text-techo-blue-600 dark:text-techo-blue-400' : 'text-techo-gray-500 dark:text-techo-gray-400'}`}>{description}</p>}
        </div>
        {actions && <div className="flex gap-2 relative">{actions}</div>}
      </div>
      <div className={`p-5 relative ${isHighlight ? 'bg-white/80 dark:bg-techo-gray-900/40 backdrop-blur-sm rounded-b-xl' : ''} text-techo-gray-700 dark:text-techo-gray-200`}>
        {children}
      </div>
      {isHighlight && <span aria-hidden className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-techo-blue-500 via-techo-cyan-400 to-techo-accent-400 rounded-l-xl" />}
    </Component>
  );
}
